Here is the transcription of the conversation. I have labeled the speakers as **Delcy** (the woman translating and facilitating), **Josué** (the man speaking Spanish), and **English Speaker** (the developer), along with the automated voice from the video they play.

---

**Delcy:** Inicia.

**Josué:** Okay. Siendo las 8:30 del día 27 de febrero, damos inicio al flujo de aprobación. Ya, mira. Cada proyecto tiene diferente tamaño. Quiere decir que tiene diferente cantidad de personas y también puede tener diferentes puestos. Lo ideal es que en un proyecto grande hay una persona que solicita, ¿no?, primero la aprobación. Luego de esto pasa a la persona 2, persona 3, persona 4, persona 5 y por fin se tiene la aprobación, ¿no? Este sería, digamos, lo ideal. Pero en la práctica no sucede eso. A veces el proyecto 2 puede decir, "¿Sabes qué? Persona 1 va a solicitar, persona 3 y persona 5 nada más lo van a aprobar". Y en otro proyecto ¿qué puede decir? "¿Sabes qué? Cualquiera de estas personas lo puede aprobar, la persona 3 o la persona 4. Cualquiera de ellos dos, y luego al final lo aprueba el cinco", ¿te das cuenta? Entonces cada proyecto tiene diferentes personas, diferentes flujos de aprobación. Y esto en la programación no podemos hacernos... pucha, sería muy complicado para cada proyecto. Para evitar eso, la solución es esta... A ver, ¿dónde está?... Más... aprobación de Microsoft. No sé si se alcanza a escuchar.

**Delcy:** Está en mute.

**Josué:** ¿Cómo le quito el mute ahora?

**Delcy:** Así como ya le pusiste ahora. Ahora sí dale play.

**Josué:** No puedo darle...

**Delcy:** _(Whispering to the English Speaker)_ What is he trying to do? In the task manager?

**English Speaker:** What is he trying to do?

**Josué:** ¿Cómo...?

**English Speaker:** What is he trying to do?

**Delcy:** He's trying to share, listen the video.

**Josué:** Ya, ahí subió. Ya bueno, ya ha subido. Ya, lo voy a activar este, el audio para que puedas escucharme.

**[Video Playback]:** Fíjate que al pedir un... puedes pedir que te apruebe una persona, varias personas, tres personas, que apruebe primero la segunda, luego la tercera, o que si hay varias personas responsables, el primero que lo apruebe ya sirva, ¿no? Puedes elegir aquí, es decir, al responder ya este panel de aprobaciones, ya sea a muchos aprobadores... el primero que lo haga ya está. Y en cualquier caso me voy a meter aquí con mi usuario que tengo para realizar, digamos, prácticas. Entonces, ¿qué va a suceder ahora? Que la solicitud va a ir de mi usuario a mi usuario, con lo cual no tiene mucho sentido, pero es lo que voy a poder testear yo solo en este vídeo. Así que, eh... bueno, pues lo vamos a dejar, realmente se ve el proceso entero, ahora lo vas a ver. [...] Prioridades, aquí puedes agregar si es prioridad media, o importante, esto básicamente es...

**Josué:** Ya, esa de prioridades no es tan relevante en este caso, ¿ya? Pero al menos para hacer el flujo...

**Delcy:** Pero... pero yo quiero que el... la aprobación sea dinámico, y que sea flexible, y que sea una parte que las personas o los usuarios del proyecto, o el administrador del proyecto, pueda configurar.

**Josué:** Lo de... exacto, eso.

**Delcy:** So what he wants in the approvals is like the person in charge of the project should be able to do their own proper setup, setting, their own configuration, should add this person will do that, it will flow to this way, to this way, so...

**English Speaker:** Okay.

**Josué:** Ya, ahora qué más, este, Delcy. Eh, no solo es esto, sino también que eh... eso lo vamos a usar en diferentes aplicaciones. Por ejemplo, cuando hacemos en compras hay también alguien que solicita y alguien que aprueba. Y así vamos a ver en diferentes aplicaciones. Entonces esta aplicación de aprobaciones va a servir para todas las aplicaciones.

**Delcy:** So that case should be like a module. So we can use that module to like a different... no, it's not a module, like that feature we should use in the different modules that we have, like providers, daily report...

**English Speaker:** So I still don't understand like which thing needs a validation, and which thing is generating validation. So when you say providers, providers doesn't have like a validation section?

**Delcy:** No, when we say like a materials, like for example a person that is working in the company goes and say like we need to buy this amount of X things. And then in order to go forward, then that has... so they make like a... send a request, "want to buy this". And that, in order to go, that goes for the process. The person from in charge of storage maybe is going to send the request and then the person from the financial cost approves that. And then finally the manager of the project, the direct manager has also to approve that. So it goes like that in that flow.

**English Speaker:** So, the flow is between the users.

**Delcy:** Between the users.

**English Speaker:** But it could be like anything, like from machines, if you want to add a machine, equipment...

**Delcy:** Yes.

**English Speaker:** You still have to have like a different set of approvals for that, right?

**Delcy:** Um... yeah, that's a good point. Josué, ¿qué... qué cosas nosotros tenemos que enlistar qué cosas necesita aprobación, qué cosas no necesita aprobación?

**Josué:** Correcto. Es válido, es válido. Este... por ejemplo, es que eso va a depender, familia, de cada proyecto.

**Delcy:** Ya, pero entonces eso al... cuando hacemos el proyecto ya ahí podemos hacer la configuración.

**Josué:** Claro, por eso yo decía que es importante crear este módulo de aprobación.

**Delcy:** That's why... I guess that's like a plug-in. So it's a mini thing that we can add because it's very random. It's going to depend on each project, how they want to deal with that. Sometimes...

**English Speaker:** But who is this person who's in charge of...

**Delcy:** ¿Quién es la persona que va a hacer esa configuración?

**Josué:** En el proyecto vamos a asignar a un usuario. A cualquier usuario, a uno o varios usuarios, ¿no?, que tengan el permiso para editar.

**Delcy:** Ya, ya, pero ¿qué usuario? ¿Cuál es el rol de ese usuario?

**Josué:** Eh, ya... el encargado del sistema, ¿no?

**Delcy:** Ya.

**Josué:** El key user. El key user y puede ser un auxiliar, alguien, es muy variado amiga. Pero alguien que haga de key user y que tenga el permiso para editar estas aprobaciones.

**Delcy:** Like a person from the tech side from the company.

**English Speaker:** So that would be us.

**Delcy:** Yeah. Josué, pero entonces eso va a ser nosotros, digamos. Se le pregunta cómo quieren y se le configura.

**Josué:** Bueno, es parte del setup, ¿no?

**Delcy:** Sí, sí, al inicio sí, al inicio sí, amiga, nosotros lo vamos a hacer.

**English Speaker:** So what I am going to, when it... so I am going to suggest something. So we have a form now, where you create something. Once you create a form, or once you create the thing, on the right side it will show you like to use a template. So when you click on the template, right? No, here's the thing. The moment the equipment is there, anything is there, equipment, provider, anything is there, right? At the top what I'm going to do is per project, I will give like a checklist of all the projects, all the modules in that project. Okay? So there will be one more page which will just be like all the modules in the project. And on the modules of the project, you can select using a template, what is the... like the checklist system? Like from where to where to where to where to where. Like from top to bottom, who are the people who are responsible for what.

**Delcy:** Ah, okay.

**English Speaker:** Right? So maybe there are like five roles in the company, right? So you just select, you just arrange, from where it goes to where it goes to where it goes to where. Who are all the people who are going to sign it? Who has the role to create it? Who has the role to sign it? And who has the role to read it? Right? So I will just do it for all the modules.

**Delcy:** Yeah, okay.

**English Speaker:** But is it for all the modules or just like some of the modules do not need? For example, in the RRHH (HR), you add an employee. Does that also require like a checklist?

**Delcy:** Like an approval, you're saying?

**English Speaker:** Yeah, approval.

**Delcy:** Josué, cuando se va... cuando se va a integrar un nuevo personal en el área de recursos humanos, ¿también tiene que seguir un flujo de aprobación, o quién aprueba?

**Josué:** Sí, también a veces, amiga. Es que eso va a depender de la madurez del proyecto y de la empresa. Al inicio no vamos a usar nada de eso, va a ser directo, pero según pasa el tiempo y según crece el sistema, en algún momento sí se va a... va a haber flujos porque... ahí hay flujos.

**Delcy:** O sea...

**Josué:** Delcy, en la práctica, sí hay un requerimiento, alguien lo solicita y no lo van a hacer a través del sistema inicialmente, pero en algún momento vamos a tener que integrar ese proceso.

**Delcy:** Yeah, so the solution, the A7 is going to create... in each module, for each module we are going to create a template, a template with a checklist that is going to incorporate roles. And what role is going to be what thing. So it's going to have that option.

**English Speaker:** And is that not complicated? Or no, yeah, no problem.

**Delcy:** Well yeah, we can do for each module. It will be because the thing is not all the time they are going to use, because again, how a company or how they want to decide to do... like how they want to do the administration of the project is up to them. Some of them they are more rigid, some of them they are very flexible. Some of them they don't want to go all the way for the system doing the approval. They don't want to go person 1, 2, 3, 4, 4. They just want 1, 5 directly. So it depends.

**English Speaker:** So a simple question. Once it is set up, like for example you have this Aramsa project. It set it up. They set it up in the beginning.

**Delcy:** Sí.

**English Speaker:** At some point during the project, are they going to go like, "Ah no, we don't want this approval, we are going to change it"? The first question is that. The second question is like for example you have provided this role to a person, this person leave the company and you do need a thing to like, you know, switch the person, like "Oh no this person no longer works"... The template, does the template need to be editable along with the person inside, or just the template will be rigid, the person will just be editable?

**Delcy:** Both of them, I guess.

**English Speaker:** But if you edit the template in the beginning, what about other equipments? For example, some of the equipments require a check from like five people. And then suddenly you're like, "You know what, we don't need checks from like three people, we only need check from two people." What about the other equipments that already had like four checks?

**Delcy:** It should be state over there as a log. That it should be keep saved on the database.

**English Speaker:** No, there are other equipments over there that have already been like you know three checks completed. Right? Or the people who have already checked it. Right? Here's the thing. Like person A, person B, person C...

**Delcy:** What we can do is we can make it like a, like as you are saying, a rebase. Like whatever it was like three, we make that to reach to five. To complete, when everything is complete in the final, because again an approval pass for several steps. Step 1, step 2, 3, 4.

**English Speaker:** No, you don't understand what I'm saying. The step 1, step 2, step 3, step 4 will always be there for the project, right? It will not be like after some time they decide like "Ah, get rid of step 2. We don't need step 2. Or nah, we don't need step 3". Here's the thing. If there are like three steps to approve equipment. We already set it up in the beginning that the three steps are needed to approve. Okay? Right? After like two months they say like "You know what, we don't need step three". Now there are other, these other equipments that have been stuck at step two for approval. Right? Now the new equipments that you create they only need two steps to approve. What about the older equipments that have already been like in the stage of like needing to approval from the step 3?

**Delcy:** That's what I told you, we need to move them to step 3. So all the older equipments will just have to like change their state to...

**English Speaker:** The person who is in charge to do that needs to do that. Oh, manually?

**Delcy:** Yeah, go to the approval. So that's like I was telling you, it should go like, the way the same way how we do in coding, rebase. So we should complete everything, like make a cut. And all that data has to be storaged, because we need, what if somebody needs to go and check what happened with that equipment, who gave the approval? That's the thing, the approvals is like a safety security card for the, when the people are in the job, in the, when they are working in the project.

**English Speaker:** So we don't know how many people are going to approve, we don't know like if there are like five people going to approve or three people are going to approve, right? Just for one equipment, just for one module. So for example the contract.

**Delcy:** Josué, ¿qué dices?

**English Speaker:** What if there are four people approving, will the contract will always be approved by four people, or like maybe just two people at some point?

**Delcy:** Maybe just two people at some point. ¿Sí? That's what he's saying. It's gonna be very flexible. That's why my brother was saying we cannot design something static. That's why he's coming to do a design like the Microsoft approvals. In Microsoft approvals, basically they do their design.

**English Speaker:** No, I can design the same thing, but what I don't understand is like how flexible we want it to be. Flexibility can be like you know, the person who sees... Here's the thing. I made it automated. I made it automated like if it requests four people to be approved, if four people have been approved, it will automatically get approved. But if now I will say like "You know what, the person decides who approves it." There will be another person who will be like "Okay it doesn't matter if 20 people have signed it, the machine is not going to automatically approve it." A person will go and check "Okay 20 people have signed it, approve." That is like the most manual and most flexible approach. A human will see, "Okay, five people have approved it, okay, just click on approve." It will not automatically approve it. Because if we don't know like how many people require to be approved, right, so what I'm going to do is like there will be like two options over there. Either you assign it to some other person to approve it, right? And then that person approve it. Or here's the thing what I'm going to tell you. Is a person sitting over there, who created for example an equipment, right? And when he created an equipment, at that moment he can put like "Okay this person needs to approve, this person needs to approve, this person needs to approve." And then save it. Every single time he has to like put...

**Delcy:** No. No. No, not every single time. The setup should be initially in the project. It can be changed with the time, but the change must be two to three times. Not every single time. It's not that, that's not the case.

**English Speaker:** Microsoft Teams also gives you the same flexibility. I did not know that. I thought like Microsoft Teams uses template. So if an equipment is being approved by like four people, it will wait for the four people to be approved. Unless you use a different template to create.

**Delcy:** But then if you go and change the initial setting of the template. Then you put for three persons. Then the thing will just work for three persons, right?

**English Speaker:** Okay. Okay. Let's see. I'll think about it.

**Delcy:** We are not getting...

**English Speaker:** No no no, I understand now. So all the play is in the template. The template should be flexible. Now, if the... you change the thing to like three people, right? Or you change it to like five people. What... here's the thing. Some of the equipments that have only three people for approval, they will just change into like "You know what, they are already approved because three people needed to approve and all the three people said yes." But now you change it to like "No, no, five people need approval." So what will happen to the other equipment that were already been approved by three people? Do they need to go to unapproved state?

**Delcy:** No, because they will be already in complete. Whatever it is incomplete, it should stay incomplete, no need to go back.

**English Speaker:** So now here's another thing. We say like five people need approval. Five people from different departments need to approve it, right? So you change... reduce number of departments...

**Delcy:** ¿Qué dice? Brother... no no no, está preguntando cómo va a ser la parte de de aprobación.

**Josué:** Ya, mira Delcy, a ver más o menos la imagen, tú puedes ver mi computadora, ¿sí o no?

**Delcy:** Sí.

**Josué:** Ya, tú ves acá que dice, ¿ves que dice ahí _account creation approval, request_ uno, dos, tres, cuatro?

**Delcy:** Approval... sí, requested, log... ah, account creation...

**Josué:** Ya, y mira, ya ahí ¿no? Acá se puede ver el flujo de quién, quién solicita, quién aprueba. Y lo mismo también aquí mira. Aquí también hay un viaje a Barcelona. Alguien solicita y alguien aprueba. Y eso puede aumentar el flujo 1, 2, 3, 4, o sea, se pueden crear varios, no hay problema.

**Delcy:** We do for every single what? Every single like...

**Josué:** Y yo como usuario...

**Delcy:** Josué, ¿cada persona va a hacer el flujo de aprobación?

**Josué:** Ah claro, hay cosas que requieren aprobación y hay cosas que no, pues ¿no? Es que... Delcy, escúchame. Esta aprobación se va a usar de dos maneras, dos funcionalidades. Uno, que es va a servir para nuestras aplicaciones que tenemos en el sistema. Y otro, para uso libre. Por ejemplo, este, a veces te dicen pues, "quiero quién aprobó, quién aprobó, quiero aprobación". No sé si has escuchado eso. O sea, es nuestra realidad en Latinoamérica. Y no es tanto el flujo tan definido, tal vez eso puede ser diferente en otros sitios, como estructurado, pero aquí un día quieren aprobación y un día no. Dependiendo... mira, vamos a suponer que la aprobación tenga dos grandes grupos. El primer grupo es la aprobación de las aplicaciones ya definidas, entonces aquí solo un usuario nomás va a definir cuál va a ser el flujo, el _key user_ digamos. Pero luego, el otro grupo sería la aprobación cualquiera, ¿no? Por ejemplo, yo quiero enviarle a Delcy que me apruebe este documento, este informe que no tiene nada que ver con el este ya, con nuestras aplicaciones, simplemente quiero que me apruebe este documento y quiero una prueba. Entonces lo adjunto con el, en la aprobación y Delcy me aprueba. Es libre. Que también para eso sirve esa aplicación, ¿no?, y se utiliza mucho. Por ejemplo, quiero que me firme un contrato, un contrato que no tiene nada que ver, es un convenio con la comunidad. Eso está fuera de la aplicación. Pero quiero dejar como evidencia o registro y utilizo esta aplicación "Aprobación" y ahí sale.

**Delcy:** Well, he's saying like uh, like every single user can also have the option to send like an approval request. For example, not only... I want and I want... suddenly I want my... like the... some mayor operator... Imagine an operator wants to leave the job, something like that. So he wants to send a request like he wants to leave the job for whatever. So he needs to send that request to his like mayor. And then he, what he can do is he can create a request that and put a case "I'm gonna leave the job now". And then the other person, mayor than him, should give, provide him the approval like "Yes. Okay, go." So it could be any kind of request.

**English Speaker:** Any kind of request.

**Delcy:** Any kind of request.

**English Speaker:** Okay.

**Delcy:** That feature should be also over there, because what happened is like uh over there in in in South America... Um, there are it's very bureaucra-... there are a lot of bureaucracy in that aspect.

**English Speaker:** So that is like an email system.

**Delcy:** Like an email system, like...

**English Speaker:** He puts a title, he puts a body like what he needs to do, and he sends it to a person, or like maybe a bunch of person, and he will put like "Okay I need these people... okay he will... he needs to know like these people are need to be informed, but these people need to approve it."

**Delcy:** Sí.

**English Speaker:** Right? Or maybe all of the people need to approve it, or just one people need to approve it, or like five people need to just see it.

**Delcy:** Yeah.

**English Speaker:** So something like that.

**Delcy:** Yeah, yeah, yeah, right, right, right. Because imagine like there is there is this person wants to leave because he's feeling sick. The main person that he has to say, but you cannot just drop the job and just go away. So somebody will say like "But okay fine, you leave the job, who gave you the approval?" Like, imagine there is there is this bunch of operators, and then this bunch of operators has like uh somebody who is which is the person, what's the name of the person who is making the checking up?

**English Speaker:** Coordinator.

**Delcy:** Like there's a main coordinator. So these persons needs to tell. But the coordinator will switch, so we cannot have something static. So these persons need to tell them, no?

**English Speaker:** Okay, that's it, right?

**Delcy:** Yeah.

**English Speaker:** Okay. I'm gonna...

**Delcy:** Sí, Josué.

**Josué:** Mira, y... yo como usuario debería permitir, o sea yo entro con mi usuario, ¿no? Y entro a mi aplicación de aprobaciones, yo tengo dos pestañas, "recibidas" y "enviadas", todas las que he recibido. Por ejemplo, aquí el viaje a Barcelona, cuando pongo en "enviados" debe estar, ¿no?, pero "recibido" ah, okay, me han rechazado mi viaje. Me han rechazado mis vacaciones, y me han aprobado, o sea... en realidad, sirve para múltiples cosas. Este mismo va a servir para para nuestras aplicaciones.

**Delcy:** Just a different module that is like aprobaciones...

**Josué:** Porque hay flujos que sí ya van bien así este definidos en cada proyecto, ¿no? Por ejemplo, el tema de la solicitud de equipos. ¿Quién aprueba? Por ejemplo el tema del parte diario, eso es básico. Parte diario, aquí me pasaron, parte diario, parte diario... ¿dónde está? Aquí está. Mira, este es el flujo. Pero no era así en otro proyecto. El operador aprueba, o sea genera este archivo. Luego el supervisor tiene que aprobar o rechazar este archivo. Si es que aprueba eso, luego pasa al jefe de equipos. Éste aprueba o rechaza este registro. Luego pasa al residente, luego a planeamiento y control de operaciones. Pero no necesariamente todo es esto, en algunos lugares es solo el operador y el jefe de equipos. O el operador y el residente. O a veces el operador, el jefe de equipos y el residente.

**Delcy:** Ya...

**Josué:** Te das cuenta, Delcy. Entonces, esa aplicación de aprobaciones permitiría automatizar de una manera más rápida, creo yo, nuestro tema de aprobaciones para diferentes aplicaciones internas y también para que el usuario pueda usar para lo que quiere, ¿pues no?

**English Speaker:** Is it part of the documents that you shared? Was this feature present in the three documents that he has shared?

**Delcy:** Sí. Parte diario.

**English Speaker:** In the parte diario?

**Delcy:** Sí. But he's not telling you that, he's telling you like this is the flow, yeah, but not always it goes like that, it simply goes like this, it just go sometimes like... sometimes directly to here... sometimes just two... So that's why he's saying like let's just create this one. So in a way like we use this in different...

**English Speaker:** I think it's like a plugin, no? We use this in any, in all the modules.

**Delcy:** Yeah, but plugin works if...

**English Speaker:** It's like a plugin or what?
