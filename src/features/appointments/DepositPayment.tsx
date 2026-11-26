import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { Body, Button, Card, Row, TextAction, money, s } from '../../components/ui';
import { useAuth } from '../auth/AuthProvider';
import { useRemote } from '../api/useRemote';
import { ApiError } from '../api/client';
import type { BookingQuote, Slot } from './model';
import {
  BookingQuoteChangedError, confirmedPaidBooking, decodeAppointmentPayments, decodePaymentConfig,
  paymentMessage, pendingPayment, prepareAppointmentPayment,
  reconcileAppointmentPayment, safePaymentUrl, startAppointmentPayment,
  type AppointmentPayment, type AppointmentPaymentRequest,
} from './payments';

type Props = {
  serviceId: number;
  selected: Slot | null;
  quote: BookingQuote;
  refreshAvailability: () => void;
  onActiveChange: (active: boolean) => void;
  onConfirmed: (booking: ReturnType<typeof confirmedPaidBooking>) => void;
};
export function DepositPayment({serviceId,selected,quote,refreshAvailability,onActiveChange,onConfirmed}:Props) {
  const {token}=useAuth();
  const config=useRemote(token?'/payments/config':null,token,decodePaymentConfig);
  const history=useRemote(token?'/payments/my':null,token,decodeAppointmentPayments);
  const [own,setOwn]=useState<{token:string;payment:AppointmentPayment}|null>(null);
  const [dismissed,setDismissed]=useState<string|null>(null);
  const [accepted,setAccepted]=useState(false);
  const [starting,setStarting]=useState(false);
  const [verifying,setVerifying]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [now,setNow]=useState(()=>Date.now());
  const recovered=pendingPayment(history.data,serviceId,now);
  const payment=own?.token===token&&own.payment.serviceId===serviceId?own.payment:recovered?.id!==dismissed?recovered:null;
  const paymentRef=useRef(payment),tokenRef=useRef(token),confirmedRef=useRef(onConfirmed);
  useEffect(()=>{paymentRef.current=payment;tokenRef.current=token;confirmedRef.current=onConfirmed;},[payment,token,onConfirmed]);
  const mounted=useRef(true),startingRef=useRef(false),verifyingRef=useRef(false),completed=useRef<string|null>(null);
  const prepared=useRef<{token:string;request:AppointmentPaymentRequest}|null>(null);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const hasPayment=!!payment;
  useEffect(()=>{onActiveChange(hasPayment);return()=>onActiveChange(false);},[hasPayment,onActiveChange]);
  const verify=useCallback(async(silent=false)=>{
    const current=paymentRef.current;
    if(!token||!current||verifyingRef.current)return;
    verifyingRef.current=true;
    if(!silent)setVerifying(true);
    try{
      const result=await reconcileAppointmentPayment(token,current.id);
      if(!mounted.current||tokenRef.current!==token)return;
      setOwn({token,payment:result});setError(null);
      if(result.status==='approved'&&completed.current!==result.id){
        const booking=confirmedPaidBooking(result);completed.current=result.id;confirmedRef.current(booking);
      }
    }catch(value){if(!silent&&mounted.current&&tokenRef.current===token)setError(value instanceof Error?value.message:'No se pudo verificar el pago. Puedes reintentar.');}
    finally{verifyingRef.current=false;if(mounted.current){setVerifying(false);setNow(Date.now());}}
  },[token]);
  const paymentId=payment?.id,paymentStatus=payment?.status;
  useEffect(()=>{
    if(!paymentId||!['creating','pending','refund_pending'].includes(paymentStatus||''))return;
    const check=()=>{if(AppState.currentState==='active'||AppState.currentState===null)void verify(true);};
    check();const timer=setInterval(check,8000);
    const listener=AppState.addEventListener('change',state=>{if(state==='active')void verify(true);});
    return()=>{clearInterval(timer);listener.remove();};
  },[paymentId,paymentStatus,verify]);
  async function start(){
    if(!token||!selected||!accepted||!config.data?.enabled||history.loading||history.error||payment||startingRef.current)return;
    startingRef.current=true;setStarting(true);setError(null);
    try{
      let request=prepared.current?.token===token?prepared.current.request:null;
      if(!request||request.service_id!==serviceId||request.appointment_date!==selected.date||Number(request.expected_amount)!==quote.deposit){
        request=await prepareAppointmentPayment(token,serviceId,selected.date,quote);
        prepared.current={token,request};
      }
      const result=await startAppointmentPayment(token,request);
      if(!mounted.current||tokenRef.current!==token)return;
      setOwn({token,payment:result});history.refresh();
    }catch(value){
      if(mounted.current&&tokenRef.current===token){setError(value instanceof Error?value.message:'No se pudo preparar el anticipo. Reintenta sin volver a pagar.');history.refresh();if(value instanceof BookingQuoteChangedError||(value instanceof ApiError&&value.status===409)){prepared.current=null;setAccepted(false);refreshAvailability();}}
    }finally{startingRef.current=false;if(mounted.current){setStarting(false);setNow(Date.now());}}
  }
  async function open(){
    if(!payment)return;
    try{setError(null);await Linking.openURL(safePaymentUrl(payment.checkoutUrl));}
    catch(value){setError(value instanceof Error?value.message:'No se pudo abrir Mercado Pago. Pulsa Verificar pago para reintentar.');}
  }
  if(payment){
    const canPay=['creating','pending'].includes(payment.status)&&Date.parse(payment.expiresAt)>now;
    const canChooseAgain=['expired','rejected','refunded'].includes(payment.status);
    return <Card>
      <Text style={s.subheading}>Anticipo de tu cita</Text>
      <Row label="Servicio" value={payment.serviceName}/>
      <Row label="Fecha y hora" value={payment.date.replace('T',' ').slice(0,16)}/>
      <Row label="Anticipo" value={money(payment.amount)}/>
      <Row label="Resto en la estética" value={money(payment.remaining)}/>
      {payment.testMode&&<Body muted>Pago de prueba: utiliza únicamente una tarjeta ficticia de Mercado Pago. No se cobra dinero real.</Body>}
      <Body>{paymentMessage(payment)}</Body>
      {canPay&&payment.checkoutUrl&&<Button label="Pagar anticipo en Mercado Pago" icon="external-link" onPress={()=>void open()}/>}
      <Button label="Verificar pago" loading={verifying} secondary onPress={()=>void verify()}/>
      <Body muted>Al terminar en Mercado Pago, regresa a esta app. La cita se confirma únicamente después de verificar el anticipo.</Body>
      {canChooseAgain&&<TextAction label="Elegir otro horario" onPress={()=>{setDismissed(payment.id);setOwn(null);prepared.current=null;setError(null);history.refresh();}}/>}
      {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    </Card>;
  }
  return <Card>
    <Text style={s.subheading}>Confirma con tu anticipo</Text>
    <Row label="Total del servicio" value={money(quote.total)}/>
    <Row label={`Anticipo (${quote.percentage}%)`} value={money(quote.deposit)}/>
    <Row label="Resto en la estética" value={money(quote.remaining)}/>
    {config.data?.testMode&&<Body muted>Demostración: el pago utiliza tarjetas ficticias y no cobra dinero real.</Body>}
    <Body muted>Primero elige un horario. El anticipo se paga en Mercado Pago y la cita se registra cuando el pago se acredita.</Body>
    <Pressable accessibilityRole="checkbox" accessibilityLabel="Acepto las condiciones del anticipo y la política de cancelación" accessibilityState={{checked:accepted}} onPress={()=>setAccepted(v=>!v)} style={{paddingVertical:12,minHeight:48}}>
      <Text style={s.body}>{accepted?'☑':'☐'} Acepto las condiciones del anticipo y la política de cancelación.</Text>
    </Pressable>
    <TextAction label="Ver política de cancelación" onPress={()=>{void Linking.openURL('https://esteticaa-frontend-ten.vercel.app/cancelaciones').catch(()=>setError('No se pudo abrir la política. Consulta el sitio de la estética.'));}}/>
    <Button label="Continuar al anticipo" loading={starting} disabled={!selected||!accepted||config.loading||history.loading||!!config.error||!!history.error||!config.data?.enabled} onPress={()=>void start()}/>
    {(config.error||history.error)&&<><Text accessibilityRole="alert" style={s.error}>{config.error||history.error}</Text><TextAction label="Volver a consultar pagos" onPress={()=>{config.refresh();history.refresh();}}/></>}
    {!config.loading&&config.data&&!config.data.enabled&&<Text accessibilityRole="alert" style={s.error}>Los pagos en línea no están habilitados. Contacta a la estética antes de reservar.</Text>}
    {!!error&&<Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </Card>;
}
