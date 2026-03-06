USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C02000_ListaActoCondicionInseguro]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C02000_ListaActoCondicionInseguro](
	[C02000_CodigoActoCondicion] [varchar](5) NOT NULL,
	[C02000_ActoCondicion] [varchar](100) NULL,
	[C02000_CategoriaActoCondicionn] [varchar](20) NULL,
 CONSTRAINT [PK_tbl_C02000_ListaActoCondicionInseguro] PRIMARY KEY CLUSTERED 
(
	[C02000_CodigoActoCondicion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A01', N'A01: NO CUMPLIR CON LOS PROCEDIMIENTOS DE TRABAJO ESTABLECIDOS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A02', N'A02: USO INCORRECTO DE EPP', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A03', N'A03: INTERFERIR O RETIRAR DISPOSITIVOS DE SEGURIDAD O DE CONTROL AMBIENTAL', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A04', N'A04: REALIZAR TRABAJOS SIN AUTORIZACIÓN O CON AUTORIZACIÓN PARCIAL', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A05', N'A05: EMPLEAR EQUIPOS O HERRAMIENTAS DEFECTUOSAS O EN FORMA PELIGROSA', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A06', N'A06: TRABAJAR SOBRE EQUIPOS EN MOVIMIENTO O RIESGOSOS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A07', N'A07: MAL USO DE HERRAMIENTA O EQUIPO', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A08', N'A08: OPERAR O CONDUCIR A VELOCIDAD INADECUADA O DISTRAÍDO', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A09', N'A09: ADOPTAR POSICIONES O POSTURAS PELIGROSAS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A10', N'A10: FALTA DE ATENCIÓN EN LA TAREA', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A11', N'A11: DISTRAER, MOLESTAR, INCULCAR, REÑIR, SORPRENDER A OTROS COLABORADORES', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A12', N'A12: NO ASEGURAR LAS HERRAMIENTAS O MATERIALES EN TRABAJOS EN ALTURA', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A13', N'A13: NO RESPETAR EL ÁREA DE SEGURIDAD EN LAS MANIOBRAS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A14', N'A14: REALIZAR TRABAJOS SIN BLOQUEAR ENERGÍAS AL INTERVENIR MÁQUINAS O EQUIPOS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A15', N'A15: INGRESAR A ÁREAS RESTRINGIDAS SIN AUTORIZACIÓN', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A16', N'A16: NO UTILIZAR EQUIPOS DE CONTENCIÓN DE DERRAMES', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A17', N'A17: NO REALIZAR LA SEGREGACIÓN ADECUADA DE LOS RESIDUOS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A18', N'A18: MANIPULACIÓN O TRASLADO INADECUADO DE MATERIALES PELIGROSOS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A19', N'A19: DEJAR MATERIAL, EQUIPOS, OTROS ABANDONADOS/ EXPUESTOS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A20', N'A20: DEJAR PUERTAS Y VENTANAS ABIERTAS AL TÉRMINO DE SUS LABORES.', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A21', N'A21: RETIRAR MATERIAL, EQUIPOS, OTROS SIN AUTORIZACIÓN ESCRITA.', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A22', N'A22: NO REALIZAR EL CHECK LIST DE PRE USO', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A23', N'A23: FUMAR EN ZONAS NO AUTORIZADAS O CERCA COMBUSTIBLES', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A24', N'A24: LEVANTAR OBJETOS DE FORMA INADECUADA', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A25', N'A25: REALIZAR TRABAJOS SIN ESTAR CAPACITADO', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A26', N'A26: TRABAJAR BAJO INFLUENCIA DE ALCOHOL Y/O DROGAS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A27', N'A27: REALIZAR TRABAJOS DE ALTO RIESGO (ALTURA, CALIENTE, ETC.) SIN AUTORIZACIÓN.', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'A99', N'A99: OTROS', N'ACTO INSEGURO')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C01', N'C01: FALTA O DEFICIENTE COLOCACIÓN DE DISPOSITIVOS DE SEGURIDAD (GUARDAS U OTROS)', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C02', N'C02: HERRAMIENTA/ EQUIPOS/ MATERIALES DEFECTUOSOS', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C03', N'C03: DISEÑO INADECUADO DEL EQUIPO O DEL TRABAJO', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C04', N'C04: FALTA O DEFICIENTE ILUMINACIÓN EN LA ZONA DE TRABAJO', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C05', N'C05: INSTALACIONES ELÉCTRICAS DEFECTUOSOS.', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C06', N'C06: FALTA DE ORDEN, LIMPIEZA O ALMACENAMIENTO INADECUADO.', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C07', N'C07: FALTA O DEFICIENTE SEÑALIZACIÓN EN LA ZONA DE TRABAJO', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C08', N'C08: MATERIALES INFLAMABLES CERCA DE TRABAJOS EN CALIENTE.', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C09', N'C09: NO SE CUENTA CON ÁREAS PARA LA SEGREGACIÓN DE RESIDUOS', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C10', N'C10: MANTENIMIENTO INADECUADO DE EQUIPOS O HERRAMIENTAS', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C11', N'C11: DEFICIENTE ESTADO DE LOS SISTEMAS DE CIERRE ( CERRADURAS, PESTILLOS, CANDADOS , OTROS)', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C12', N'C12: ESCALERAS, ANDAMIOS, PLATAFORMAS EN MAL ESTADO.', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C13', N'C13: SUPERFICIES DE TRABAJO EN MAL ESTADO O RESBALOSAS.', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C14', N'C14: VÍA DE CIRCULACIÓN EN MAL ESTADO U OBSTRUIDAS', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C15', N'C15: CONDICIONES CLIMÁTICAS ADVERSAS (TORMENTA ELÉCTRICA, GRANIZADA, ETC.)', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C16', N'C16: NO CUENTA CON EL ÁREA DE CONTENCIÓN RESPECTIVA', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C17', N'C17: PRESENCIA DE AGENTES NOCIVOS EN LA ATMÓSFERA', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C18', N'C18: VEHÍCULO NO AUTORIZADO O NO CORRECTAMENTE EQUIPADO PARA EL TRASLADO DE MATERIALES PELIGROSOS', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C19', N'C19: INSTALACIONES DEFECTUOSAS O SUB ESTÁNDARES', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C20', N'C20: COMUNICACIÓN LIMITADA', N'CONDICIÓN INSEGURA')
INSERT [dbo].[tbl_C02000_ListaActoCondicionInseguro] ([C02000_CodigoActoCondicion], [C02000_ActoCondicion], [C02000_CategoriaActoCondicionn]) VALUES (N'C99', N'C99: OTROS', N'CONDICIÓN INSEGURA')
GO
