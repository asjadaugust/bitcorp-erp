USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C08009_TipoEquipo]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C08009_TipoEquipo](
	[C08009_IdTipoEquipo] [varchar](2) NOT NULL,
	[C08009_TipoEquipo] [varchar](50) NULL,
	[C08009_IdCategoria] [varchar](2) NULL,
	[C08009_Categoria] [varchar](20) NULL,
	[C08009_Codificacion] [varchar](5) NULL,
 CONSTRAINT [PK_tbl_C08009_TipoEquipo] PRIMARY KEY CLUSTERED 
(
	[C08009_IdTipoEquipo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'AM', N'AUTOMÓVIL', N'VL', N'VEHÍCULO LIVIANO', N'VL-AM')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CA', N'CISTERNA DE AGUA', N'VP', N'VEHÍCULO PESADO', N'VP-CA')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CB', N'CAMIÓN BARANDA', N'VL', N'VEHÍCULO LIVIANO', N'VL-CB')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CC', N'CISTERNA DE COMBUSTIBLE', N'VP', N'VEHÍCULO PESADO', N'VP-CC')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CE', N'CISTERNA DE EMULSIÓN', N'VP', N'VEHÍCULO PESADO', N'VP-CE')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CF', N'CARGADOR FRONTAL', N'MP', N'MAQUINARIA PESADA', N'MP-CF')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CI', N'COMBI', N'VL', N'VEHÍCULO LIVIANO', N'VL-CI')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CM', N'CAMIONETA', N'VL', N'VEHÍCULO LIVIANO', N'VL-CM')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CO', N'COMPRESORA', N'EM', N'EQUIPO MENOR', N'EM-CO')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CP', N'CAMIÓN IMPRIMADOR', N'VP', N'VEHÍCULO PESADO', N'VP-CP')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'CR', N'CORTADORA DE CEMENTO', N'EM', N'EQUIPO MENOR', N'EM-CR')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'EF', N'EQUIPO DE FISURA', N'EM', N'EQUIPO MENOR', N'EM-EF')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'ET', N'ESTACIÓN TOTAL', N'EM', N'EQUIPO MENOR', N'EM-ET')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'EX', N'EXCAVADORA SOBRE ORUGA', N'MP', N'MAQUINARIA PESADA', N'MP-EX')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'GG', N'GENERADOR', N'EM', N'EQUIPO MENOR', N'EM-GG')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'GR', N'GRAVILLADORA', N'MP', N'MAQUINARIA PESADA', N'MP-GR')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'HL', N'HIDROLAVADORA', N'EM', N'EQUIPO MENOR', N'EM-HL')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'MB', N'MOTOBOMBA', N'EM', N'EQUIPO MENOR', N'EM-MB')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'MC', N'MINICARGADOR', N'MP', N'MAQUINARIA PESADA', N'MP-MC')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'MF', N'MINIFRESADORA', N'EM', N'EQUIPO MENOR', N'EM-MF')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'MN', N'MOTONIVELADORA', N'MP', N'MAQUINARIA PESADA', N'MP-MN')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'MS', N'MOTOSOLDADORA', N'EM', N'EQUIPO MENOR', N'EM-MS')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'MV', N'MINIVAN', N'VL', N'VEHÍCULO LIVIANO', N'VL-MV')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'MZ', N'MEZCLADORA DE CONCRETO', N'EM', N'EQUIPO MENOR', N'EM-MZ')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'NT', N'NIVEL TOPOGRÁFICO', N'EM', N'EQUIPO MENOR', N'EM-NT')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'PM', N'PAVIMENTADOR DE MORTERO ASFALTICO', N'MP', N'MAQUINARIA PESADA', N'MP-PM')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'RC', N'RECICLADORA', N'MP', N'MAQUINARIA PESADA', N'MP-RC')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'RL', N'RODILLO LISO', N'MP', N'MAQUINARIA PESADA', N'MP-RL')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'RN', N'RODILLO NEUMATICO', N'MP', N'MAQUINARIA PESADA', N'MP-RN')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'RT', N'RODILLO TANDEM', N'MP', N'MAQUINARIA PESADA', N'MP-RT')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'RX', N'RETROEXCAVADORA', N'MP', N'MAQUINARIA PESADA', N'MP-RX')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'TI', N'TANQUE IMPRIMADOR', N'EM', N'EQUIPO MENOR', N'EM-TI')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'TO', N'TRACTOR SOBRE ORUGA', N'MP', N'MAQUINARIA PESADA', N'MP-TO')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'VI', N'VIBROAPISONADOR', N'EM', N'EQUIPO MENOR', N'EM-VI')
INSERT [dbo].[tbl_C08009_TipoEquipo] ([C08009_IdTipoEquipo], [C08009_TipoEquipo], [C08009_IdCategoria], [C08009_Categoria], [C08009_Codificacion]) VALUES (N'VQ', N'VOLQUETE', N'VP', N'VEHÍCULO PESADO', N'VP-VQ')
GO
