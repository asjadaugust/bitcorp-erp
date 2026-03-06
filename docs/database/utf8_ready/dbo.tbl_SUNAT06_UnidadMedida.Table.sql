USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_SUNAT06_UnidadMedida]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_SUNAT06_UnidadMedida](
	[SUNAT06_Id_UM] [varchar](10) NULL,
	[SUNAT06_UnidadMedida] [varchar](50) NULL,
	[SUNAT06_UM] [varchar](10) NULL
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'1', N'KILOGRAMOS', N'kg')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'10', N'BARRILES', N'BRR')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'11', N'LATAS', N'LAT')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'12', N'CAJAS', N'CAJ')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'13', N'MILLARES', N'Millar')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'14', N'METROS CÚBICOS', N'm3')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'15', N'METROS', N'm')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'2', N'LIBRAS', N'lb')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'3', N'TONELADAS LARGAS', N'lon ton')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'4', N'TONELADAS MÉTRICAS', N't')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'5', N'TONELADAS CORTAS', N'short ton')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'6', N'GRAMOS', N'g')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'7', N'UNIDADES', N'NIU')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'8', N'LITROS', N'L')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'9', N'GALONES', N'Gal')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.01', N'PARES', N'PAR')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.02', N'BALDES', N'BAL')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.03', N'BIDONES', N'BID')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.04', N'BOLSAS', N'BLS')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.05', N'BOBINAS', N'BOB')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.07', N'CILINDROS', N'CIL')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.08', N'FRASCOS', N'FRC')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.09', N'KIT', N'KIT')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.10', N'METRO CUADRADO', N'm2')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.11', N'ONZAS', N'OZ')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.12', N'PAILAS', N'PAI')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.13', N'PALETAS', N'PAL')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.14', N'PAQUETE', N'PAQ')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.15', N'PLANCHAS', N'PLC')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.16', N'PLIEGO', N'PLG')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.17', N'PIES', N'PS')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.18', N'PIES CUADRADOS', N'PS2')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.19', N'PIES CUBICOS', N'PS3')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.2', N'PIES TABLARES(MADERA)', N'PST')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.21', N'PULGADAS', N'PUL')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.22', N'PIEZAS', N'PZA')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.23', N'ROLLOS', N'ROL')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.24', N'SACO', N'SAC')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.25', N'SET', N'SET')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.26', N'TIRAS', N'TIR')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.27', N'TUBOS', N'TUB')
INSERT [dbo].[tbl_SUNAT06_UnidadMedida] ([SUNAT06_Id_UM], [SUNAT06_UnidadMedida], [SUNAT06_UM]) VALUES (N'99.06', N'BOTELLAS', N'BOT')
GO
