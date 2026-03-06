USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C05027_RegistroTrabajador]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C05027_RegistroTrabajador](
	[C05027_Id_RegistroTrabajador] [int] NOT NULL,
	[G00001_Id_UnidadOperativa] [varchar](7) NULL,
	[C05000_DNI] [varchar](8) NULL,
	[C07001_RUC] [varchar](11) NULL,
	[C05027_FechaIngreso] [date] NULL,
	[C05027_FechaCese] [date] NULL,
	[C05027_Estatus] [varchar](10) NULL,
	[C05027_FechaRegistro] [date] NULL,
	[C0527_RegistradoPor] [varchar](50) NULL,
	[C0527_SubGrupo] [varchar](50) NULL,
 CONSTRAINT [PK_tbl_C05027_RegistroTrabajador] PRIMARY KEY CLUSTERED 
(
	[C05027_Id_RegistroTrabajador] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[tbl_C05027_RegistroTrabajador]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C05027_RegistroTrabajador_tbl_C05000_Trabajador] FOREIGN KEY([C05000_DNI])
REFERENCES [dbo].[tbl_C05000_Trabajador] ([C05000_DNI])
GO
ALTER TABLE [dbo].[tbl_C05027_RegistroTrabajador] CHECK CONSTRAINT [FK_tbl_C05027_RegistroTrabajador_tbl_C05000_Trabajador]
GO
ALTER TABLE [dbo].[tbl_C05027_RegistroTrabajador]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C05027_RegistroTrabajador_tbl_C07001_Proveedor] FOREIGN KEY([C07001_RUC])
REFERENCES [dbo].[tbl_C07001_Proveedor] ([C07001_RUC])
GO
ALTER TABLE [dbo].[tbl_C05027_RegistroTrabajador] CHECK CONSTRAINT [FK_tbl_C05027_RegistroTrabajador_tbl_C07001_Proveedor]
GO
ALTER TABLE [dbo].[tbl_C05027_RegistroTrabajador]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C05027_RegistroTrabajador_tbl_G00001_UnidadOperativa] FOREIGN KEY([G00001_Id_UnidadOperativa])
REFERENCES [dbo].[tbl_G00001_UnidadOperativa] ([G00001_Id_UnidadOperativa])
GO
ALTER TABLE [dbo].[tbl_C05027_RegistroTrabajador] CHECK CONSTRAINT [FK_tbl_C05027_RegistroTrabajador_tbl_G00001_UnidadOperativa]
GO
