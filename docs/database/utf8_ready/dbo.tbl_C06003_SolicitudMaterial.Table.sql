USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C06003_SolicitudMaterial]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C06003_SolicitudMaterial](
	[C06003_IdSolicitudMaterial] [int] NOT NULL,
	[C06003_Motivo] [varchar](50) NULL,
	[C06003_FechaSolicitud] [date] NULL,
	[C06003_SolicitadoPor] [varchar](100) NULL,
 CONSTRAINT [PK_tbl_C06003_Requerimiento] PRIMARY KEY CLUSTERED 
(
	[C06003_IdSolicitudMaterial] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
