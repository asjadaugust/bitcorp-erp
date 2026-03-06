USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_G00007_ComponenteUnidadOperativa]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_G00007_ComponenteUnidadOperativa](
	[G00007_Id_Componente] [varchar](15) NOT NULL,
	[G00007_Componente] [varchar](50) NULL,
	[G00007_CodComponente] [varchar](7) NULL,
	[G00001_Id_UnidadOperativa] [varchar](7) NULL,
 CONSTRAINT [PK_tbl_G00007_ComponenteUnidadOperativa] PRIMARY KEY CLUSTERED 
(
	[G00007_Id_Componente] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
INSERT [dbo].[tbl_G00007_ComponenteUnidadOperativa] ([G00007_Id_Componente], [G00007_Componente], [G00007_CodComponente], [G00001_Id_UnidadOperativa]) VALUES (N'04.CCU_01', N'CONSERVACIÓN RUTINARIA ANTES DE MEJORAMIENTO', N'CRAM', N'04.CCU')
INSERT [dbo].[tbl_G00007_ComponenteUnidadOperativa] ([G00007_Id_Componente], [G00007_Componente], [G00007_CodComponente], [G00001_Id_UnidadOperativa]) VALUES (N'04.CCU_02', N'EMERGENCIAS', N'EMERGEN', N'04.CCU')
INSERT [dbo].[tbl_G00007_ComponenteUnidadOperativa] ([G00007_Id_Componente], [G00007_Componente], [G00007_CodComponente], [G00001_Id_UnidadOperativa]) VALUES (N'04.CCU_03', N'MEJORAMIENTO', N'MEJORAM', N'04.CCU')
GO
