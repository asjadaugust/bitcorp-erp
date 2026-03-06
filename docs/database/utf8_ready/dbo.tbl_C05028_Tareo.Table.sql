USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C05028_Tareo]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C05028_Tareo](
	[C05028_Id_Tareo] [int] NOT NULL,
	[C05027_Id_RegistroTrabajador] [int] NULL,
	[C05028_Fecha] [date] NULL,
	[C05025_Tareo] [varchar](20) NULL,
	[C05025_CodigoTareo] [varchar](4) NULL,
	[C05025_FechaRegistro] [date] NULL,
	[C05025_RegistradoPor] [varchar](50) NULL,
 CONSTRAINT [PK_tbl_C05028_Tareo] PRIMARY KEY CLUSTERED 
(
	[C05028_Id_Tareo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[tbl_C05028_Tareo]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C05028_Tareo_tbl_C05027_RegistroTrabajador] FOREIGN KEY([C05027_Id_RegistroTrabajador])
REFERENCES [dbo].[tbl_C05027_RegistroTrabajador] ([C05027_Id_RegistroTrabajador])
GO
ALTER TABLE [dbo].[tbl_C05028_Tareo] CHECK CONSTRAINT [FK_tbl_C05028_Tareo_tbl_C05027_RegistroTrabajador]
GO
