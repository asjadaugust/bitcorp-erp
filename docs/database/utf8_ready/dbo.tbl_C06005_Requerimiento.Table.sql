USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C06005_Requerimiento]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C06005_Requerimiento](
	[C06005_NumRequerimiento] [int] NULL,
	[C06005_Motivo] [varchar](50) NULL,
	[C06005_FechaRequerimiento] [date] NULL,
	[C06005_SolicitadoPor] [varchar](50) NULL
) ON [PRIMARY]
GO
