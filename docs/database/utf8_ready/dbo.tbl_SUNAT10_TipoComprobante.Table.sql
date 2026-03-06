USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_SUNAT10_TipoComprobante]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_SUNAT10_TipoComprobante](
	[SUNAT10_CodigoTipoComprobante] [varchar](10) NOT NULL,
	[SUNAT10_TipoComprobante] [varchar](50) NULL,
	[SUNAT10_Comprobante] [varchar](10) NULL,
 CONSTRAINT [PK_tbl_SUNAT10_TipoComprobante] PRIMARY KEY CLUSTERED 
(
	[SUNAT10_CodigoTipoComprobante] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'01', N'FACTURA', N'FAC')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'02', N'RECIBO POR HONORARIOS', N'RH')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'03', N'BOLETA DE VENTA', N'BV')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'09', N'GUÍA DE REMISIÓN - REMITENTE', N'GR-R')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'12', N'TICKET O CINTA EMITIDO POR MÁQUINA REGISTRADORA', N'TICKET')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'31', N'GUÍA DE REMISIÓN - TRANSPORTISTA', N'GR-T')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'99.01', N'VALE DE SALIDA', N'VALE-S')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'99.02', N'VALE DE INGRESO', N'VALE-I')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'99.03', N'VALE DE COMBUSTIBLE', N'VALE-C')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'99.04', N'COMPROBANTE DE CAJA', N'CC')
INSERT [dbo].[tbl_SUNAT10_TipoComprobante] ([SUNAT10_CodigoTipoComprobante], [SUNAT10_TipoComprobante], [SUNAT10_Comprobante]) VALUES (N'99.05', N'VALORIZACIÓN EQUIPO', N'VALO-E')
GO
