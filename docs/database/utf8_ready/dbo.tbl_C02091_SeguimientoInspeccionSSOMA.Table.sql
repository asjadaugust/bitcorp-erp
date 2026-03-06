USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C02091_SeguimientoInspeccionSSOMA]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C02091_SeguimientoInspeccionSSOMA](
	[C02091_NumRegistro] [int] IDENTITY(1,1) NOT NULL,
	[C02091_FechaHallazgo] [smalldatetime] NULL,
	[C02091_LugarHallazgo] [varchar](50) NULL,
	[C02091_TipoInspeccion] [varchar](20) NULL,
	[C02091_Inspector_DNI] [varchar](8) NULL,
	[C02091_Inspector] [varchar](100) NULL,
	[C02091_DescripcionHallazgo] [varchar](250) NULL,
	[C02091_LinkFoto] [varchar](250) NULL,
	[C02091_NivelRiesgo] [varchar](10) NULL,
	[C02091_CausasHallazgo] [varchar](250) NULL,
	[C02091_ResponsableSubsanacion] [varchar](100) NULL,
	[C02091_FechaSubsanacion] [date] NULL,
	[C02091_Estado] [varchar](20) NULL,
 CONSTRAINT [PK_tbl_C02091_SeguimientoInspeccionSSOMA] PRIMARY KEY CLUSTERED 
(
	[C02091_NumRegistro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[tbl_C02091_SeguimientoInspeccionSSOMA] ON 

INSERT [dbo].[tbl_C02091_SeguimientoInspeccionSSOMA] ([C02091_NumRegistro], [C02091_FechaHallazgo], [C02091_LugarHallazgo], [C02091_TipoInspeccion], [C02091_Inspector_DNI], [C02091_Inspector], [C02091_DescripcionHallazgo], [C02091_LinkFoto], [C02091_NivelRiesgo], [C02091_CausasHallazgo], [C02091_ResponsableSubsanacion], [C02091_FechaSubsanacion], [C02091_Estado]) VALUES (1, CAST(N'2021-03-12T10:46:00' AS SmallDateTime), N'ASDFASDF', N'Planificado', N'47403012', NULL, N'ASDFSADF', N'ASDFASDFASDF', N'ALTO', N'AFDASDF', N'ASDFASDF', CAST(N'2021-03-31' AS Date), NULL)
SET IDENTITY_INSERT [dbo].[tbl_C02091_SeguimientoInspeccionSSOMA] OFF
GO
