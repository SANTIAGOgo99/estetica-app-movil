import {test,expect,type Page} from '@playwright/test';
import {mockApi,login,service} from './fixtures';

const requestId='bd226274-f9bb-425a-9b30-963eac4f2e87',paymentId='a81d5077-0443-46a4-9a8c-978af33868b8';
async function setup(page:Page,recover=false){
 await mockApi(page);
 let date='',approved=false,expired=false,starts=0,direct=0;
 const amount=Number(service.price)*0.3;
 const payment=()=>({id:paymentId,kind:'appointment',currency:'MXN',status:approved?'approved':expired?'expired':'pending',amount:amount.toFixed(2),test_mode:true,appointment_id:approved?99:null,expires_at:new Date(Date.now()+15*60000).toISOString(),checkout_url:'https://www.mercadopago.com.mx/checkout/v1/redirect?order_id=ORDTSTFIXTURE',snapshot:{service_id:service.id,service_name:service.name,duration_minutes:45,appointment_date:date+'T11:00:00',total_amount:String(service.price),deposit_amount:amount.toFixed(2),remaining_amount:(Number(service.price)-amount).toFixed(2)}});
 page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/api/appointments')direct++;});
 await page.route('https://api.example.test/api/payments/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/api/payments/config')return route.fulfill({json:{payments_enabled:true,test_mode:true}});
  if(path==='/api/payments/my')return route.fulfill({json:{payments:recover||starts?[payment()]:[]}});
  if(path.endsWith('/quote'))return route.fulfill({json:{request_key:requestId,amount:amount.toFixed(2),snapshot:payment().snapshot}});
  if(path==='/api/payments/appointments'){starts++;expect(route.request().postDataJSON().request_key).toBe(requestId);return route.fulfill({json:{payment:payment()},status:201});}
  if(path.endsWith('/reconcile'))return route.fulfill({json:{payment:payment()}});
  return route.fulfill({status:404,json:{error:'Unknown explicit payment fixture'}});
 });
 await page.route('https://api.example.test/api/appointments/slots?**',route=>{
  date=new URL(route.request().url()).searchParams.get('date')||'';
  return route.fulfill({json:{available_slots:[{time:'11:00',appointment_date:date+'T11:00:00',available:true}],deposit_required:true,total_amount:String(service.price),deposit_amount:amount.toFixed(2),remaining_amount:(Number(service.price)-amount).toFixed(2),deposit_percentage:30}});
 });
 await page.goto('/sign-in');await page.getByPlaceholder('nombre@correo.com').fill(login.email);await page.getByPlaceholder('Tu contraseña').fill(login.password);await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(page.getByText('Hola, Cliente',{exact:true})).toBeVisible();
 await page.goto('/booking?service=2');await page.getByRole('button',{name:/^\d{4}-\d{2}-\d{2}$/}).first().click();
 return {approve:()=>{approved=true;},expire:()=>{expired=true;},counts:()=>({starts,direct})};
}

test('anticipo exige consentimiento y confirma solo después de acreditación',async({page})=>{
 const state=await setup(page);
 await page.getByRole('button',{name:'11:00 disponible',exact:true}).click();
 const begin=page.getByRole('button',{name:'Continuar al anticipo',exact:true});await expect(begin).toBeDisabled();
 await page.getByRole('checkbox',{name:'Acepto las condiciones del anticipo y la política de cancelación'}).click();await expect(begin).toBeEnabled();await begin.click();
 await expect(page.getByRole('button',{name:'Pagar anticipo en Mercado Pago'})).toBeVisible();
 await expect(page.getByText('¡Cita registrada!',{exact:true})).toHaveCount(0);
 expect(state.counts()).toEqual({starts:1,direct:0});
 state.approve();await page.getByRole('button',{name:'Verificar pago',exact:true}).click();
 await expect(page.getByText('¡Cita registrada!',{exact:true})).toBeVisible({timeout:20000});
 await expect(page.getByText('#99',{exact:true})).toBeVisible();expect(state.counts()).toEqual({starts:1,direct:0});
});
test('recupera un anticipo pendiente sin crear otro checkout',async({page})=>{
 const state=await setup(page,true);
 await expect(page.getByRole('button',{name:'Pagar anticipo en Mercado Pago'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Continuar al anticipo',exact:true})).toHaveCount(0);
 expect(state.counts()).toEqual({starts:0,direct:0});
});
test('un anticipo vencido no muestra una cita confirmada',async({page})=>{
 const state=await setup(page);
 await page.getByRole('button',{name:'11:00 disponible',exact:true}).click();await page.getByRole('checkbox',{name:'Acepto las condiciones del anticipo y la política de cancelación'}).click();await page.getByRole('button',{name:'Continuar al anticipo',exact:true}).click();
 await expect(page.getByRole('button',{name:'Pagar anticipo en Mercado Pago'})).toBeVisible();state.expire();await page.getByRole('button',{name:'Verificar pago',exact:true}).click();
 await expect(page.getByText('La reserva temporal venció. Verifica el pago antes de elegir otro horario.',{exact:true})).toBeVisible({timeout:20000});
 await expect(page.getByText('¡Cita registrada!',{exact:true})).toHaveCount(0);expect(state.counts().direct).toBe(0);
});
