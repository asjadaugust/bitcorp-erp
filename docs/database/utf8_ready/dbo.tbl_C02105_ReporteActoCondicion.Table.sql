USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C02105_ReporteActoCondicion]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C02105_ReporteActoCondicion](
	[C02105_0NumRegistro] [int] IDENTITY(1,1) NOT NULL,
	[C02105_0FechaRegistro] [smalldatetime] NULL,
	[C02105_0RegistradoPorDNI] [varchar](8) NULL,
	[C02105_0RegistradoPor] [varchar](60) NULL,
	[C02105_0ModificadoPor] [varchar](100) NULL,
	[C02105_0FechaModificacion] [smalldatetime] NULL,
	[G00001_Id_UnidadOperativa] [varchar](10) NULL,
	[C02105_1ReportadoPorDNI] [varchar](8) NULL,
	[C02105_1ReportadoPor] [varchar](60) NULL,
	[C02105_1Cargo] [varchar](50) NULL,
	[C02105_1Empresa] [varchar](100) NULL,
	[C02105_2Fecha] [smalldatetime] NULL,
	[C02105_2Lugar] [varchar](30) NULL,
	[C02105_2Empresa] [varchar](50) NULL,
	[C02105_2SistemaGestion] [varchar](20) NULL,
	[C02105_2TipoReporte] [varchar](20) NULL,
	[C02105_2CodigoActoCondicion] [varchar](10) NULL,
	[C02105_2ActoCondicion] [varchar](100) NULL,
	[C02105_2DañoA] [varchar](200) NULL,
	[C02105_2Descripcion] [varchar](200) NULL,
	[C02105_3ComoActue] [varchar](200) NULL,
	[C02105_3Estado] [varchar](10) NULL,
	[C02105_4_1PorQue] [varchar](100) NULL,
	[C02105_4_2PorQue] [varchar](100) NULL,
	[C02105_4_3PorQue] [varchar](100) NULL,
	[C02105_4_4PorQue] [varchar](100) NULL,
	[C02105_4_5PorQue] [varchar](100) NULL,
	[C02105_5AccionCorrectiva] [varchar](200) NULL,
 CONSTRAINT [PK_C02105_ReporteActoCondicion] PRIMARY KEY CLUSTERED 
(
	[C02105_0NumRegistro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[tbl_C02105_ReporteActoCondicion] ON 

INSERT [dbo].[tbl_C02105_ReporteActoCondicion] ([C02105_0NumRegistro], [C02105_0FechaRegistro], [C02105_0RegistradoPorDNI], [C02105_0RegistradoPor], [C02105_0ModificadoPor], [C02105_0FechaModificacion], [G00001_Id_UnidadOperativa], [C02105_1ReportadoPorDNI], [C02105_1ReportadoPor], [C02105_1Cargo], [C02105_1Empresa], [C02105_2Fecha], [C02105_2Lugar], [C02105_2Empresa], [C02105_2SistemaGestion], [C02105_2TipoReporte], [C02105_2CodigoActoCondicion], [C02105_2ActoCondicion], [C02105_2DañoA], [C02105_2Descripcion], [C02105_3ComoActue], [C02105_3Estado], [C02105_4_1PorQue], [C02105_4_2PorQue], [C02105_4_3PorQue], [C02105_4_4PorQue], [C02105_4_5PorQue], [C02105_5AccionCorrectiva]) VALUES (4, CAST(N'2021-03-30T18:14:00' AS SmallDateTime), N'71573512', N'ANTONIO RUIZ CHEPPE', NULL, NULL, N'06.CAA', N'71573512', N'ANTONIO RUIZ CHEPPE', N'INGENIERO DE SEGURIDAD Y MEDIO AMBIENTE', N'ARAMSA', CAST(N'2021-03-16T16:51:00' AS SmallDateTime), N'RUTA 22', N'ARAMSA', N'SST (SEGURIDAD)', N'ACTO INSEGURO', N'A02', N'A02: USO INCORRECTO DE EPP', N' CABEZA; SISTEMA RESPIRATORIO;', N'El trabajador no contaba con EPP tales como Casco y mascarilla.', N'Se le indicó que debe usar los EPP dotados por la empresa.', N'CERRADO', N'Exceso de confianza del trabajador', N'Falta de Vigilancia en campo de utilizacion EPP (mascarilla y Casco)', N'Falta de sensibilización al personal', NULL, NULL, N'Sensibilizar al personal en Uso correcto de EPP.
')
INSERT [dbo].[tbl_C02105_ReporteActoCondicion] ([C02105_0NumRegistro], [C02105_0FechaRegistro], [C02105_0RegistradoPorDNI], [C02105_0RegistradoPor], [C02105_0ModificadoPor], [C02105_0FechaModificacion], [G00001_Id_UnidadOperativa], [C02105_1ReportadoPorDNI], [C02105_1ReportadoPor], [C02105_1Cargo], [C02105_1Empresa], [C02105_2Fecha], [C02105_2Lugar], [C02105_2Empresa], [C02105_2SistemaGestion], [C02105_2TipoReporte], [C02105_2CodigoActoCondicion], [C02105_2ActoCondicion], [C02105_2DañoA], [C02105_2Descripcion], [C02105_3ComoActue], [C02105_3Estado], [C02105_4_1PorQue], [C02105_4_2PorQue], [C02105_4_3PorQue], [C02105_4_4PorQue], [C02105_4_5PorQue], [C02105_5AccionCorrectiva]) VALUES (5, CAST(N'2021-03-30T18:23:00' AS SmallDateTime), N'71573512', N'ANTONIO RUIZ CHEPPE', NULL, NULL, N'06.CAA', N'71573512', N'ANTONIO RUIZ CHEPPE', N'INGENIERO DE SEGURIDAD Y MEDIO AMBIENTE', N'ARAMSA', CAST(N'2021-03-16T16:51:00' AS SmallDateTime), N'RUTA 22', N'ARAMSA', N'SST (SEGURIDAD)', N'ACTO INSEGURO', N'A02', N'A02: USO INCORRECTO DE EPP', N' CABEZA; SISTEMA RESPIRATORIO;', N'El trabajador no contaba con EPP tales como Casco y mascarilla.
Trabajador: Jaime Baylon Miranda
Puesto: Auxiliar de Campo', N'Se le indicó que debe usar los EPP dotados por la empresa.', N'CERRADO', N'Exceso de confianza del trabajador', N'Falta de Vigilancia en campo de utilizacion EPP (mascarilla y Casco)', N'Falta de sensibilización al personal', NULL, NULL, N'Sensibilizar al personal en el uso correcto de los EPP')
SET IDENTITY_INSERT [dbo].[tbl_C02105_ReporteActoCondicion] OFF
GO
