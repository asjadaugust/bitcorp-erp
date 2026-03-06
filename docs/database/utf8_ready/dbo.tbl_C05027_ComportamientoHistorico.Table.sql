USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C05027_ComportamientoHistorico]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C05027_ComportamientoHistorico](
	[C05027_IdComportamientoHistorico] [int] NOT NULL,
	[C05027_Cargo] [varchar](50) NULL,
	[C05027_Salario] [decimal](18, 0) NULL,
	[C05027_FechaInicio] [date] NULL,
	[C05027_FechaFin] [date] NULL,
	[C05027_NumContrato] [varchar](50) NULL,
	[C05027_Id_RegistroTrabajador] [int] NULL,
 CONSTRAINT [PK_tbl_C05027_ComportamientoHistorico] PRIMARY KEY CLUSTERED 
(
	[C05027_IdComportamientoHistorico] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[tbl_C05027_ComportamientoHistorico]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C05027_ComportamientoHistorico_tbl_C05027_RegistroTrabajador] FOREIGN KEY([C05027_Id_RegistroTrabajador])
REFERENCES [dbo].[tbl_C05027_RegistroTrabajador] ([C05027_Id_RegistroTrabajador])
GO
ALTER TABLE [dbo].[tbl_C05027_ComportamientoHistorico] CHECK CONSTRAINT [FK_tbl_C05027_ComportamientoHistorico_tbl_C05027_RegistroTrabajador]
GO
