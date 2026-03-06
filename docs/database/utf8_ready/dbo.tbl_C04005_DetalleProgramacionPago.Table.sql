USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C04005_DetalleProgramacionPago]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C04005_DetalleProgramacionPago](
	[C04004_NumProgramacion] [varchar](11) NOT NULL,
	[C04005_Item] [int] NOT NULL,
	[C04002_IdCuentaPagar] [varchar](15) NULL,
	[C04005_DNI_RUC] [varchar](11) NULL,
	[C04005_RazonSocial] [varchar](100) NULL,
	[C04002_Comprobante] [varchar](10) NULL,
	[C04002_NumComprobante] [varchar](30) NULL,
	[C04005_Concepto] [varchar](200) NULL,
	[C04005_Moneda] [varchar](10) NULL,
	[C04005_MontoFinal] [money] NULL,
	[C04005_MontoPagado] [money] NULL,
	[C04005_MontoProgramado] [money] NULL,
	[C04005_LugarPago] [varchar](10) NULL,
 CONSTRAINT [PK_tbl_C04004_ProgramacionPagos] PRIMARY KEY CLUSTERED 
(
	[C04004_NumProgramacion] ASC,
	[C04005_Item] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_C04005_DetalleProgramacionPago] ([C04004_NumProgramacion], [C04005_Item], [C04002_IdCuentaPagar], [C04005_DNI_RUC], [C04005_RazonSocial], [C04002_Comprobante], [C04002_NumComprobante], [C04005_Concepto], [C04005_Moneda], [C04005_MontoFinal], [C04005_MontoPagado], [C04005_MontoProgramado], [C04005_LugarPago]) VALUES (N'04.CCU_002', 1, N'04.CCU-006959', N'20305385795', N'BITUMENES DEL PERU S.A.C.', N'Factura', N'S/S-F001-3778', N'', N'SOLES', 23194.0800, 0.0000, 5000.0000, N'PROYECTO')
GO
ALTER TABLE [dbo].[tbl_C04005_DetalleProgramacionPago]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C04005_DetalleProgramacionPago_tbl_C04002_CuentasPorPagar] FOREIGN KEY([C04002_IdCuentaPagar])
REFERENCES [dbo].[tbl_C04002_CuentasPorPagar] ([C04002_IdCuentaPagar])
GO
ALTER TABLE [dbo].[tbl_C04005_DetalleProgramacionPago] CHECK CONSTRAINT [FK_tbl_C04005_DetalleProgramacionPago_tbl_C04002_CuentasPorPagar]
GO
ALTER TABLE [dbo].[tbl_C04005_DetalleProgramacionPago]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C04005_DetalleProgramacionPago_tbl_C04004_ProgramacionPago] FOREIGN KEY([C04004_NumProgramacion])
REFERENCES [dbo].[tbl_C04004_ProgramacionPago] ([C04004_NumProgramacion])
GO
ALTER TABLE [dbo].[tbl_C04005_DetalleProgramacionPago] CHECK CONSTRAINT [FK_tbl_C04005_DetalleProgramacionPago_tbl_C04004_ProgramacionPago]
GO
