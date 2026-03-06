USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C06004_DetalleSolicitudMaterial]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C06004_DetalleSolicitudMaterial](
	[C06004_IdDetalleRequerimiento] [int] NULL,
	[C06003_IdRequerimiento] [nchar](10) NULL,
	[C06002_IdProducto] [varchar](8) NULL,
	[C06004_Producto] [varchar](100) NULL,
	[C06004_Cantidad] [decimal](18, 0) NULL,
	[C06004_UM] [varchar](10) NULL,
	[C06004_FechaRequerida] [date] NULL,
	[C06004_MarcaSugerida] [varchar](50) NULL,
	[C06004_Descripcion] [varchar](50) NULL,
	[C06004_Link] [varchar](50) NULL,
	[C06004_Estatus] [varchar](50) NULL
) ON [PRIMARY]
GO
