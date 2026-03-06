USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C020911_SeguimientoInspeccion]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C020911_SeguimientoInspeccion](
	[C020911_NumRegistro] [int] NOT NULL,
	[C020911_Fecha] [smalldatetime] NULL,
	[C020911_InspectorDNI] [nchar](10) NULL,
	[C020911_Inspector] [varchar](100) NULL,
	[C020911_DescripcionInspeccion] [varchar](250) NULL,
	[C020911_LinkEvidencia] [varchar](200) NULL,
	[C020911_FechaProximaInspeccion] [date] NULL,
	[C020911_AvanceEstimado] [int] NULL,
	[C02091_NumRegistro] [int] NOT NULL,
 CONSTRAINT [PK_tbl_C020911_SeguimientoInspeccion] PRIMARY KEY CLUSTERED 
(
	[C020911_NumRegistro] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[tbl_C020911_SeguimientoInspeccion]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C020911_SeguimientoInspeccion_tbl_C02091_SeguimientoInspeccionSSOMA] FOREIGN KEY([C02091_NumRegistro])
REFERENCES [dbo].[tbl_C02091_SeguimientoInspeccionSSOMA] ([C02091_NumRegistro])
GO
ALTER TABLE [dbo].[tbl_C020911_SeguimientoInspeccion] CHECK CONSTRAINT [FK_tbl_C020911_SeguimientoInspeccion_tbl_C02091_SeguimientoInspeccionSSOMA]
GO
