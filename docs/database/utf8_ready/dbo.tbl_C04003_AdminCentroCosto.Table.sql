USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_C04003_AdminCentroCosto]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_C04003_AdminCentroCosto](
	[C04002_IdCuentaPagar] [varchar](15) NOT NULL,
	[C04003_IdAdminCC] [int] NOT NULL,
	[C04003_CodComponente] [varchar](7) NULL,
	[C04001_CodCentroCosto] [varchar](12) NULL,
	[C04003_CentroCosto] [varchar](60) NULL,
	[C04003_Porcentaje] [smallint] NULL,
	[C04003_MontoFinal] [money] NULL,
 CONSTRAINT [PK_tbl_C04003_AdminCentroCosto] PRIMARY KEY CLUSTERED 
(
	[C04003_IdAdminCC] ASC,
	[C04002_IdCuentaPagar] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[tbl_C04003_AdminCentroCosto]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C04003_AdminCentroCosto_tbl_C04001_CentroCosto] FOREIGN KEY([C04001_CodCentroCosto])
REFERENCES [dbo].[tbl_C04001_CentroCosto] ([C04001_CodPartida])
GO
ALTER TABLE [dbo].[tbl_C04003_AdminCentroCosto] CHECK CONSTRAINT [FK_tbl_C04003_AdminCentroCosto_tbl_C04001_CentroCosto]
GO
ALTER TABLE [dbo].[tbl_C04003_AdminCentroCosto]  WITH CHECK ADD  CONSTRAINT [FK_tbl_C04003_AdminCentroCosto_tbl_C04002_CuentasPorPagar] FOREIGN KEY([C04002_IdCuentaPagar])
REFERENCES [dbo].[tbl_C04002_CuentasPorPagar] ([C04002_IdCuentaPagar])
GO
ALTER TABLE [dbo].[tbl_C04003_AdminCentroCosto] CHECK CONSTRAINT [FK_tbl_C04003_AdminCentroCosto_tbl_C04002_CuentasPorPagar]
GO
