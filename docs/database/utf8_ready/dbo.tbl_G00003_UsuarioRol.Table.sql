USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_G00003_UsuarioRol]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_G00003_UsuarioRol](
	[G00003_Id_UsuarioRol] [int] IDENTITY(1,1) NOT NULL,
	[G00002_DNI] [varchar](8) NULL,
	[G00004_Id_Rol] [int] NULL,
	[G00001_Id_UnidadOperatova] [varchar](7) NULL,
 CONSTRAINT [PK_tbl_000_UsuarioRol] PRIMARY KEY CLUSTERED 
(
	[G00003_Id_UsuarioRol] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[tbl_G00003_UsuarioRol] ON 

INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (1, N'47403012', 2, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (2, N'44924295', 1, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (3, N'12345678', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (4, N'47403012', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (5, N'72121594', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (6, N'47403012', 4, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (7, N'72121594', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (8, N'45952345', 4, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (9, N'75137115', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (10, N'70060689', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (11, N'07204945', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (12, N'08166748', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (13, N'15623642', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (14, N'02167083', 4, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (15, N'44924295', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (16, N'45208471', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (17, N'47923775', 5, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (18, N'02167083', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (19, N'44924295', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (20, N'45952345', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (21, N'42448116', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (22, N'75137115', 3, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (23, N'71573512', 6, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (24, N'47403012', 6, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (25, N'72121594', 7, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (26, N'44924295', 6, NULL)
INSERT [dbo].[tbl_G00003_UsuarioRol] ([G00003_Id_UsuarioRol], [G00002_DNI], [G00004_Id_Rol], [G00001_Id_UnidadOperatova]) VALUES (27, N'45208471', 7, NULL)
SET IDENTITY_INSERT [dbo].[tbl_G00003_UsuarioRol] OFF
GO
ALTER TABLE [dbo].[tbl_G00003_UsuarioRol]  WITH CHECK ADD  CONSTRAINT [FK_tbl_G00003_UsuarioRol_tbl_G00002_Usuario1] FOREIGN KEY([G00002_DNI])
REFERENCES [dbo].[tbl_G00002_Usuario] ([G00002_DNI])
GO
ALTER TABLE [dbo].[tbl_G00003_UsuarioRol] CHECK CONSTRAINT [FK_tbl_G00003_UsuarioRol_tbl_G00002_Usuario1]
GO
ALTER TABLE [dbo].[tbl_G00003_UsuarioRol]  WITH CHECK ADD  CONSTRAINT [FK_tbl_G00003_UsuarioRol_tbl_G00004_Rol] FOREIGN KEY([G00004_Id_Rol])
REFERENCES [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol])
GO
ALTER TABLE [dbo].[tbl_G00003_UsuarioRol] CHECK CONSTRAINT [FK_tbl_G00003_UsuarioRol_tbl_G00004_Rol]
GO
