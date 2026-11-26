import { apiRequest, object } from '../api/client.ts';
import type { BookingQuote } from './model.ts';

export type AppointmentPayment = {
  id: string;
  status: string;
  amount: number;
  total: number;
  remaining: number;
  serviceId: number;
  serviceName: string;
  duration: number;
  date: string;
  expiresAt: string;
  checkoutUrl: string | null;
  appointmentId: number | null;
  testMode: boolean;
};
export type AppointmentPaymentRequest = {
  request_key: string;
  service_id: number;
  appointment_date: string;
  expected_amount: string;
  accepted_policies: true;
};
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const statuses = ['creating','pending','approved','rejected','expired','refund_pending','refunded','review'];
const sameTime = (a: string,b: string) => a.replace(' ','T').slice(0,19)===b.replace(' ','T').slice(0,19);
export class BookingQuoteChangedError extends Error {}

export function safePaymentUrl(value: unknown): string {
  if(typeof value!=='string')throw Error('El enlace de pago aún no está disponible. Pulsa Verificar pago.');
  const url=new URL(value);
  if(url.protocol!=='https:'||url.hostname!=='www.mercadopago.com.mx'||!url.pathname.startsWith('/checkout/')||url.username||url.password)throw Error('El enlace de pago no es válido. Vuelve a consultar tu anticipo.');
  return url.href;
}
export function decodeAppointmentPayment(value: unknown): AppointmentPayment {
  const p=object(value),s=object(p.snapshot);
  const amount=Number(p.amount),total=Number(s.total_amount),remaining=Number(s.remaining_amount),serviceId=Number(s.service_id),duration=Number(s.duration_minutes);
  if(typeof p.id!=='string'||!uuid.test(p.id)||p.kind!=='appointment'||p.currency!=='MXN'||typeof p.status!=='string'||!statuses.includes(p.status)||!Number.isFinite(amount)||amount<=0||!Number.isFinite(total)||total<amount||!Number.isFinite(remaining)||remaining<0||Math.round(total*100)!==Math.round(amount*100)+Math.round(remaining*100)||!Number.isInteger(serviceId)||serviceId<=0||!Number.isInteger(duration)||duration<=0||typeof s.service_name!=='string'||typeof s.appointment_date!=='string'||!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}$/.test(s.appointment_date)||typeof p.expires_at!=='string'||!Number.isFinite(Date.parse(p.expires_at))||typeof p.test_mode!=='boolean')throw Error('No se pudo interpretar el anticipo. Revisa tus citas antes de volver a pagar.');
  const appointmentId=p.appointment_id==null?null:Number(p.appointment_id);
  if(appointmentId!==null&&(!Number.isInteger(appointmentId)||appointmentId<=0))throw Error('El comprobante de la cita está incompleto.');
  return {id:p.id,status:p.status,amount,total,remaining,serviceId,serviceName:s.service_name,duration,date:s.appointment_date,expiresAt:p.expires_at,checkoutUrl:p.checkout_url==null?null:safePaymentUrl(p.checkout_url),appointmentId,testMode:p.test_mode};
}
export function decodeAppointmentPayments(value: unknown): AppointmentPayment[] {
  const response=object(value);
  if(!Array.isArray(response.payments))throw Error('No se pudieron consultar los anticipos.');
  return response.payments.filter(v=>object(v).kind==='appointment').map(decodeAppointmentPayment);
}
export function decodePaymentConfig(value: unknown) {
  const c=object(value);
  if(typeof c.payments_enabled!=='boolean'||typeof c.test_mode!=='boolean')throw Error('No se pudo consultar la configuración de pagos.');
  return {enabled:c.payments_enabled,testMode:c.test_mode};
}
export function pendingPayment(payments: AppointmentPayment[] | null,serviceId: number,now=Date.now()) {
  return payments?.find(p=>p.serviceId===serviceId&&['creating','pending'].includes(p.status)&&Date.parse(p.expiresAt)>now)??null;
}
export async function prepareAppointmentPayment(token:string,serviceId:number,date:string,quote:BookingQuote,fetcher:typeof fetch=fetch):Promise<AppointmentPaymentRequest> {
  if(!quote.required||quote.deposit<=0)throw Error('Esta cita no requiere un anticipo.');
  const response=object(await apiRequest('/payments/appointments/quote',{token,method:'POST',body:{service_id:serviceId,appointment_date:date,expected_amount:quote.deposit.toFixed(2),accepted_policies:true}},fetcher));
  const snapshot=object(response.snapshot),amount=Number(response.amount);
  if(typeof response.request_key!=='string'||!uuid.test(response.request_key)||Number(snapshot.service_id)!==serviceId||typeof snapshot.appointment_date!=='string'||!sameTime(snapshot.appointment_date,date))throw Error('La cotización no corresponde a esta cita. Vuelve a consultar los horarios.');
  if(!Number.isFinite(amount)||Math.round(amount*100)!==Math.round(quote.deposit*100)||Math.round(Number(snapshot.total_amount)*100)!==Math.round(quote.total*100))throw new BookingQuoteChangedError('El precio o anticipo cambió. Vuelve a seleccionar el horario antes de pagar.');
  return {request_key:response.request_key,service_id:serviceId,appointment_date:date,expected_amount:amount.toFixed(2),accepted_policies:true};
}
export async function startAppointmentPayment(token:string,request:AppointmentPaymentRequest,fetcher:typeof fetch=fetch) {
  const result=object(await apiRequest('/payments/appointments',{token,method:'POST',body:request},fetcher));
  const payment=decodeAppointmentPayment(result.payment);
  if(payment.serviceId!==request.service_id||!sameTime(payment.date,request.appointment_date)||Math.round(payment.amount*100)!==Math.round(Number(request.expected_amount)*100))throw Error('El pago no corresponde a la cotización aceptada.');
  return payment;
}
export async function reconcileAppointmentPayment(token:string,id:string,fetcher:typeof fetch=fetch) {
  if(!uuid.test(id))throw Error('El comprobante no es válido.');
  const result=object(await apiRequest('/payments/'+id+'/reconcile',{token,method:'POST',body:{}},fetcher));
  const payment=decodeAppointmentPayment(result.payment);
  if(payment.id!==id)throw Error('El comprobante recibido no corresponde a este anticipo.');
  return payment;
}
export function confirmedPaidBooking(payment:AppointmentPayment) {
  if(payment.status!=='approved'||!payment.appointmentId)throw Error('El anticipo aún no ha confirmado la cita.');
  return {id:payment.appointmentId,status:'confirmed',total:payment.total,deposit:payment.amount,date:payment.date.slice(0,10),time:payment.date.slice(11,16),serviceName:payment.serviceName,duration:payment.duration};
}
export function paymentMessage(payment:AppointmentPayment) {
  return ({creating:'Estamos preparando el enlace de pago. Puedes reintentar sin duplicar el cobro.',pending:'Tu cita se confirmará cuando Mercado Pago acredite el anticipo.',approved:'Anticipo acreditado. Tu cita está confirmada.',expired:'La reserva temporal venció. Verifica el pago antes de elegir otro horario.',rejected:'El pago fue rechazado y la cita no se confirmó.',refund_pending:'Se está gestionando la devolución. La cita no se confirmó.',refunded:'El pago fue devuelto. Consulta tus citas antes de reservar nuevamente.',review:'Este pago necesita revisión de la estética. Consulta tus citas antes de volver a pagar.'})[payment.status]??'Verifica el estado de tu anticipo.';
}
