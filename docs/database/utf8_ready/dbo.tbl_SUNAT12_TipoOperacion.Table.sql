USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_SUNAT12_TipoOperacion]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_SUNAT12_TipoOperacion](
	[SUNAT12_TipoOperacion] [varchar](50) NOT NULL,
	[SUNAT12_Cod_Operacion] [varchar](10) NULL,
	[SUNAT12_IngresoSalida] [varchar](7) NULL,
	[SUNAT12_DocInterno] [varchar](20) NULL,
	[SUNAT12_ClienteProveedor] [varchar](10) NULL,
 CONSTRAINT [PK_tbl_030_12TipoOperacion] PRIMARY KEY CLUSTERED 
(
	[SUNAT12_TipoOperacion] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'COMPRA', N'2', N'INGRESO', N'VALE DE INGRESO', N'PROVEEDOR')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'DESTRUCCIÓN', N'15', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'DEVOLUCIÓN DEL CLIENTE INTERNO', N'99.01', N'INGRESO', N'VALE DE INGRESO', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'DEVOLUCIÓN ENTREGADA(AL PROVEEDOR)', N'6', N'SALIDA', N'VALE DE SALIDA', N'PROVEEDOR')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'DONACIÓN (ENTRADA AL ALMACÉN)', N'99.06', N'INGRESO', N'VALE DE INGRESO', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'DONACIÓN (SALIDA DEL ALMACÉN)', N'9', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'INGRESO DE ACTIVOS FIJOS', N'99.05', N'INGRESO', N'VALE DE INGRESO', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'INGRESO POR PRODUCCIÓN', N'99.07', N'INGRESO', N'VALE DE INGRESO', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'PREMIO', N'8', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'PROMOCIÓN', N'7', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'RETIRO', N'12', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'SALDO INICIAL', N'16', N'INGRESO', N'VALE DE INGRESO', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'SALIDA A PRODUCCIÓN', N'10', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'SALIDA DE ACTIVOS FIJOS', N'99.04', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'TRANSFERENCIA ENTRE ALMACEN( INGRESO INTERNO)', N'99.03', N'INGRESO', N'VALE DE INGRESO', N'CLIENTE')
INSERT [dbo].[tbl_SUNAT12_TipoOperacion] ([SUNAT12_TipoOperacion], [SUNAT12_Cod_Operacion], [SUNAT12_IngresoSalida], [SUNAT12_DocInterno], [SUNAT12_ClienteProveedor]) VALUES (N'TRANSFERENCIA ENTRE ALMACEN( SALIDA INTERNO)', N'99.02', N'SALIDA', N'VALE DE SALIDA', N'CLIENTE')
GO
