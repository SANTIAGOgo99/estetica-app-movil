import {reserveAppointment} from '../src/features/appointments/client.ts';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {apiRequest, ApiError} from '../src/features/api/client.ts';
import {decodeCatalog,decodeItem} from '../src/features/catalog/model.ts';
import {decodeProfile} from '../src/features/account/model.ts';
import {decodeAppointments,decodeSlots,isUpcoming,displayedStatus} from '../src/features/appointments/model.ts';
import {registerClient} from '../src/features/auth/registration.ts';
import {needsSession,accessReason,routePath} from '../src/features/interfaces/access.ts';
process.env.EXPO_PUBLIC_API_URL='https://backend.example/api';
const response=(status,body)=>async()=>new Response(JSON.stringify(body),{status});
test('el catálogo es público; agenda, carrito y perfil requieren sesión',()=>{
 for(const name of ['home','services','products','service-detail','product-detail'])assert.equal(needsSession(name),false);
 for(const name of ['booking','appointments','cart','checkout','profile'])assert.equal(needsSession(name),true);
 assert.match(accessReason('booking'),/agendar/);assert.match(accessReason('cart'),/carrito/);
});
test('consulta pública no envía autorización; una consulta de perfil sí',async()=>{
 await apiRequest('/services/active',{},async(url,options)=>{assert.equal(url,'https://backend.example/api/services/active');assert.equal(options.headers.Authorization,undefined);return new Response('[]');});
 await apiRequest('/users/profile',{token:'session-for-test'},async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer session-for-test');return new Response('{}');});
});
test('maneja una sesión vencida y no revela detalles internos de un fallo del servidor',async()=>{
 await assert.rejects(apiRequest('/users/profile',{},response(401,{stack:'private',message:'database password'})),error=>error instanceof ApiError&&error.status===401&&!error.message.includes('database'));
 await assert.rejects(apiRequest('/services/active',{},response(500,{stack:'private',error:'connection string'})),error=>!error.message.includes('connection'));
});
test('normaliza precio y existencias, excluye inactivos y una foto inválida no bloquea el catálogo',()=>{
 const items=decodeCatalog([{id:1,name:'Shampoo',price:'120.50',stock:3,image_url:'https://[invalid',category:'Cuidado'},{id:2,name:'Oculto',price:50,is_active:false}]);
 assert.equal(items.length,1);assert.equal(items[0].price,120.5);assert.equal(items[0].stock,3);assert.equal(items[0].image,undefined);
 assert.throws(()=>decodeItem({id:0,name:'Artículo',price:20}));assert.throws(()=>decodeItem({id:3,name:'Artículo',price:-1}));
});
test('perfil real rechaza respuestas de administradores, suspendidos e incompletas',()=>{
 const profile={id:3,full_name:'Cliente',email:'cliente@example.com',phone:'5550000000',role:'client',is_active:true};
 assert.equal(decodeProfile(profile).name,'Cliente');
 for(const value of [{...profile,role:'admin'},{...profile,is_active:false},{...profile,email:null}])assert.throws(()=>decodeProfile(value));
});
test('registro envía solamente datos de cliente, sin roles administrativos',async()=>{
 await registerClient({name:' Cliente ',email:'CLIENTE@EXAMPLE.COM ',phone:'5550000000',password:'fake-test-password',role:'admin'},async(url,options)=>{
 assert.equal(url,'https://backend.example/api/auth/register');const body=JSON.parse(options.body);assert.equal(body.email,'CLIENTE@EXAMPLE.COM');assert.equal(body.full_name,'Cliente');assert.equal(body.role,undefined);return new Response(JSON.stringify({user:{id:3,role:'client'}}),{status:201});});
 await assert.rejects(registerClient({name:'Cliente',email:'cliente@example.com',phone:'5550000000',password:'fake'},response(400,{error:'El correo ya está registrado'})),/ya está registrado/);
});
test('interpreta los horarios del servidor y conserva los no disponibles',()=>{
 const data=decodeSlots({all_slots:[{time:'11:00',appointment_date:'2026-10-08 11:00:00',available:false,reason:'Ocupado'}],message:'Sin horarios'});
 assert.equal(data.slots[0].available,false);assert.equal(data.slots[0].date,'2026-10-08 11:00:00');assert.throws(()=>decodeSlots({all_slots:[{time:'11:00',available:'true'}]}));
});
test('lee la agenda real y rechaza una confirmación incompleta',()=>{
 const data=decodeAppointments({appointments:[{id:8,service_id:2,servicio:'Corte',appointment_date:'2026-10-08T11:00:00',status:'pending',total_amount:'250.00',deposit_amount:'0',duration_minutes:45}]});
 assert.equal(data[0].price,250);assert.equal(data[0].status,'pending');assert.throws(()=>decodeAppointments({appointments:[{id:8}]}));
});

test('el regreso al flujo usa solo destinos internos y conserva el servicio elegido',()=>{
 assert.equal(routePath('booking',6),'/booking?service=6');assert.equal(routePath('product-detail',15),'/product-detail?id=15');assert.equal(routePath('https://untrusted.example'),'/');assert.equal(routePath('booking',-1),'/booking');
});
test('reserva usa el horario exacto del servidor y no inventa anticipo ni confirmación',async()=>{
 const result=await reserveAppointment('session-for-test','2026-10-08 11:00:00',6,async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.appointment_date,'2026-10-08 11:00:00');assert.equal(body.service_id,6);assert.equal(body.deposit_amount,undefined);assert.equal(body.client_id,undefined);return new Response(JSON.stringify({appointment:{id:9,status:'pending',total_amount:'500.00',deposit_amount:'0'}}),{status:201});});
 assert.equal(result.status,'pending');assert.equal(result.total,500);
 await assert.rejects(reserveAppointment('session-for-test','2026-10-08 11:00:00',6,response(409,{message:'Horario ocupado'})),/ocupado/);
 await assert.rejects(reserveAppointment('session-for-test','2026-10-08 11:00:00',6,response(201,{appointment:{}})),/no confirmó/);
});

test('una cita pasada pendiente de cierre no se muestra como próxima',()=>{
 const [item]=decodeAppointments({appointments:[{id:8,service_id:2,servicio:'Corte',appointment_date:'2026-09-01T11:00:00',status:'pending',calendar_status:'pending_review',total_amount:'250',deposit_amount:'0'}]});
 assert.equal(isUpcoming(item),false);assert.equal(displayedStatus(item),'Pendiente de cierre');
});
