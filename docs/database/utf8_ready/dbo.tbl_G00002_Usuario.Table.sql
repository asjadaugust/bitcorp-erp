USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_G00002_Usuario]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_G00002_Usuario](
	[G00002_DNI] [varchar](8) NOT NULL,
	[G00002_Usuario] [varchar](50) NULL,
	[G00002_Contraseña] [varchar](50) NULL,
	[G00002_Email] [varchar](50) NULL,
	[C10_CajaChica] [varchar](50) NULL,
	[G00001_Id_UnidadOperativa] [varchar](7) NULL,
	[G00002_Estado] [varchar](8) NULL,
 CONSTRAINT [PK_tbl_000_Usuario] PRIMARY KEY CLUSTERED 
(
	[G00002_DNI] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'02039905', N'ARIZABAL RAMIREZ JUAN MANUEL  ', N'02039905', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'02167083', N'ZENON PANIAGUA ALVAREZ', N'02167083', N'zpaniagua@aramsa.pe ', NULL, N'06.CAA', N'NOACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'06548924', N'FLAVIO ZENITAGOYA BUSTAMANTE', N'06548924', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'07204945', N'VIOLETA ESCALANTE ESCUDERO', N'07204945', N'info@aramsa.pe', N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'07761865', N'MIGUEL ANGEL MENA LORA', N'07761865', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'08026475', N'CARPIO ARROYO JHONNY CHRISTIAN ', N'08026475', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'08166748', N'SANDRA ROMERO ROCA', N'08166748', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'08270671', N'CARMEN RAMIREZ DE LA CRUZ', N'08270671', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'09034591', N'VICTOR MAMANI CUARESMA', N'09034591', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'09359002', N'EDWIN AYLLÓN CHAMBERGO', N'09359002', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'10316914', N'FERNANDO ARAMAYO MALAGA', N'10316914', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'10317804', N'FEDERICO ARAMAYO MALAGA', N'10317804', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'12345678', N'USUARIO DE ALMACEN', N'123', NULL, NULL, N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'15421809', N'LUZ MARLENE VICENTE RAMIREZ', N'15421809', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'15623642', N'RAUL CABANILLAS CALDAS', N'15623642', N'rcabanillas@aramsa.pe ', NULL, N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'19248372', N'ROBERTO CARLOS VEGA QUIROZ', N'19248372', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'22098145', N'LUIS AUGUSTO RAMIREZ IZQUIERDO', N'22098145', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'42448116', N'GADY ESMERALDA LAURA GUEVARA', N'42448116', NULL, NULL, N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'44569770', N'LIZ EVELYN HUARANGA HUAMAN', N'44569770', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'44924295', N'ALVARO HUALPA CANO', N'44924295', N'aghualpa@aramsa.pe', N'Rol_Usuario', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'45208471', N'YURI AGUILAR ZAPATA', N'45208471', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'45952345', N'NELSI NATALY PEREZ BALDEON', N'45952345', N'lurquiaga@aramsa.pe', N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'46633120', N'ZANDRA GARCIA RENGIFO', N'46633120', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'46822932', N'MARJORIE ASCENCIOS SANCHEZ', N'46822932', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'46852926', N'NIVELINA PEREZ MARTINEZ', N'46852926', NULL, NULL, N'04.CCU', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'46948947', N'DAYAN ZEBALLOS PUMA', N'46948947', N'dzeballos@aramsa.pe', N'Rol_Contador', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'47178229', N'IBETH GUTIERREZ GUTIERREZ', N'47178229', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'47403012', N'JOSUE GILMAR CARHUARICRA ALANIA', N'47403012', N'jcarhuaricra@aramsa.pe', N'Rol_Contador', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'47923775', N'LUCEYLI YSABEL URQUIAGA CARRION', N'47923775', N'lurquiaga@aramsa.pe', N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'48502030', N'MARIBEL CRUZ CHIPANA', N'48502030', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'70060689', N'ERICK DIAZ BORDA', N'70060689', N'ediaz@aramsa.pe ', NULL, N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'70244343', N'LUSMILA ILDEFONSO HUARANGA', N'70244343', N'LILDEFONSO@ARAMSA.PE', NULL, N'04.CCU', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'70414977', N'GERALDINE CLAUDIA RAMIREZ VILCA', N'70414977', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'71332086', N'XIAMARA BELTRAN PONCE DE LEON', N'71332086', NULL, N'Rol_Usuario', N'01.OCL', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'71456444', N'KELY YESSET ASTOVILCA HUAMANI', N'71456444', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'71573512', N'ANTONIO RUIZ CHEPPE', N'71573512', N'aruiz@aramsa.pe', NULL, N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'72121594', N'KAREN NICOLE BASILIO MALPARTIDA', N'72121594', N'kbasilio@aramsa.pe', NULL, N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'74153040', N'CRISTHIAN CALATAYUD QUISPE', N'74153040', N'', N'', N'06.CAA', N'ACTIVO')
INSERT [dbo].[tbl_G00002_Usuario] ([G00002_DNI], [G00002_Usuario], [G00002_Contraseña], [G00002_Email], [C10_CajaChica], [G00001_Id_UnidadOperativa], [G00002_Estado]) VALUES (N'75137115', N'DELSY NELSY CARHUARICRA ALANIA', N'75137115', N'dcarhuaricra@aramsa.com.pe ', NULL, N'06.CAA', N'ACTIVO')
GO
