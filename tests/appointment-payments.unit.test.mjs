import assert from 'node:assert/strict';
import {test} from 'node:test';
import {decodeSlots} from '../src/features/appointments/model.ts';
import {BookingQuoteChangedError,confirmedPaidBooking,decodeAppointmentPayment,decodeAppointmentPayments,pendingPayment,prepareAppointmentPayment,reconcileAppointmentPayment,safePaymentUrl,startAppointmentPayment} from '../src/features/appointments/payments.ts';

process.env.EXPO_PUBLIC_API_URL='https://backend.example/api';
const paymentId='a81d5077-0443-46a4-9a8c-978af33868b8',requestId='0bef6a34-8ce5-46da-a913-e30ab5685721';
const date='2026-11-27T09:40:00';
const quote={required:true,total:150,deposit:45,remaining:105,percentage:30};
const snapshot={service_id:7,service_name:'Corte de Caballero',duration_minutes:40,appointment_date:date,total_amount:'150.00',deposit_amount:'45.00',remaining_amount:'105.00'};
const raw=(extra={})=>({id:paymentId,kind:'appointment',currency:'MXN',status:'pending',amount:'45.00',snapshot,expires_at:'2026-11-27T16:00:00.000Z',checkout_url:'https://www.mercadopago.com.mx/checkout/v1/redirect?order_id=ORDTSTTEST',appointment_id:null,test_mode:true,...extra});
const response=value=>async()=>Response.json(value);

test('slots preserve the authoritative deposit and reject inconsistent amounts',()=>{
 const base={available_slots:[{time:'09:40',appointment_date:date}],deposit_required:true,total_amount:'150.00',deposit_amount:'45.00',remaining_amount:'105.00',deposit_percentage:'30'};
 assert.deepEqual(decodeSlots(base).quote,quote);
 assert.throws(()=>decodeSlots({...base,remaining_amount:'150.00'}));
 assert.throws(()=>decodeSlots({...base,deposit_required:false}));
});
test('quote obtains the server key before any payment hold is created',async()=>{
 let calls=0;
 const request=await prepareAppointmentPayment('synthetic-token',7,date,quote,async(url,options)=>{
  calls++;assert.equal(url,'https://backend.example/api/payments/appointments/quote');assert.equal(options.method,'POST');
  assert.deepEqual(JSON.parse(options.body),{service_id:7,appointment_date:date,expected_amount:'45.00',accepted_policies:true});
  return Response.json({request_key:requestId,amount:'45.00',snapshot});
 });
 assert.equal(calls,1);assert.equal(request.request_key,requestId);assert.equal(request.expected_amount,'45.00');
});
test('changed quote requires a fresh price agreement and does not start payment',async()=>{
 await assert.rejects(prepareAppointmentPayment('token',7,date,quote,response({request_key:requestId,amount:'46.00',snapshot})),BookingQuoteChangedError);
 await assert.rejects(prepareAppointmentPayment('token',7,date,quote,response({amount:'45.00',snapshot})),/cotización/);
});
test('retrying checkout reuses its exact key and accepted payload',async()=>{
 const request={request_key:requestId,service_id:7,appointment_date:date,expected_amount:'45.00',accepted_policies:true},sent=[];
 const fetcher=async(url,options)=>{assert.equal(url,'https://backend.example/api/payments/appointments');sent.push(options.body);return Response.json({payment:raw()});};
 assert.equal((await startAppointmentPayment('token',request,fetcher)).id,paymentId);
 assert.equal((await startAppointmentPayment('token',request,fetcher)).id,paymentId);
 assert.equal(sent[0],sent[1]);assert.equal(JSON.parse(sent[0]).request_key,requestId);
});
test('pending and approved-without-appointment never become a confirmed booking',()=>{
 assert.throws(()=>confirmedPaidBooking(decodeAppointmentPayment(raw())),/aún no/);
 assert.throws(()=>confirmedPaidBooking(decodeAppointmentPayment(raw({status:'approved'}))),/aún no/);
 const result=confirmedPaidBooking(decodeAppointmentPayment(raw({status:'approved',appointment_id:82})));
 assert.equal(result.id,82);assert.equal(result.deposit,45);assert.equal(result.total,150);assert.equal(result.time,'09:40');assert.equal(result.date,'2026-11-27');
});
test('recover only the current service unexpired hold from the authenticated history',()=>{
 const payments=decodeAppointmentPayments({payments:[raw(),{kind:'products'}]});
 const now=Date.parse('2026-11-27T15:00:00Z');
 assert.equal(pendingPayment(payments,7,now).id,paymentId);
 assert.equal(pendingPayment(payments,6,now),null);
 assert.equal(pendingPayment(payments,7,now+3600001),null);
});
test('verification sends no client approval and trusts the returned appointment only',async()=>{
 const payment=await reconcileAppointmentPayment('token',paymentId,async(url,options)=>{
  assert.equal(url,'https://backend.example/api/payments/'+paymentId+'/reconcile');assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{});
  return Response.json({payment:raw({status:'approved',appointment_id:82})});
 });
 assert.equal(confirmedPaidBooking(payment).id,82);
});
test('checkout rejects untrusted destinations and invalid financial records',()=>{
 for(const url of ['http://www.mercadopago.com.mx/checkout/test','https://www.mercadopago.com.mx.evil.example/checkout/test','https://user:password@www.mercadopago.com.mx/checkout/test','https://www.mercadopago.com.mx/other'])assert.throws(()=>safePaymentUrl(url));
 assert.throws(()=>decodeAppointmentPayment(raw({kind:'products'})));
 assert.throws(()=>decodeAppointmentPayment(raw({amount:'999.00'})));
 assert.throws(()=>decodeAppointmentPayment(raw({status:'invented'})));
});
