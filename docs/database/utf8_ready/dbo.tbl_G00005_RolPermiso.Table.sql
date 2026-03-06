USE [dbBitCorp]
GO
/****** Object:  Table [dbo].[tbl_G00005_RolPermiso]    Script Date: 3/4/2026 11:33:42 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[tbl_G00005_RolPermiso](
	[G00005_Id_RolPermiso] [int] IDENTITY(1,1) NOT NULL,
	[G00004_Id_Rol] [int] NULL,
	[G00006_Id_Permiso] [int] NULL,
 CONSTRAINT [PK_tbl_000_RolPermiso] PRIMARY KEY CLUSTERED 
(
	[G00005_Id_RolPermiso] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[tbl_G00005_RolPermiso] ON 

INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (1, 1, 1)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (2, 1, 2)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (3, 2, 1)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (4, 3, 14)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (5, 3, 16)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (6, 4, 17)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (7, 4, 18)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (8, 4, 19)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (9, 5, 17)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (10, 5, 19)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (11, 5, 20)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (13, 6, 21)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (14, 7, 22)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (16, 7, 23)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (17, 6, 23)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (18, 8, 24)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (19, 9, 25)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (20, 9, 26)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (21, 9, 27)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (22, 9, 28)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (23, 9, 29)
INSERT [dbo].[tbl_G00005_RolPermiso] ([G00005_Id_RolPermiso], [G00004_Id_Rol], [G00006_Id_Permiso]) VALUES (24, 9, 30)
SET IDENTITY_INSERT [dbo].[tbl_G00005_RolPermiso] OFF
GO
ALTER TABLE [dbo].[tbl_G00005_RolPermiso]  WITH CHECK ADD  CONSTRAINT [FK_tbl_G00005_RolPermiso_tbl_G00004_Rol] FOREIGN KEY([G00004_Id_Rol])
REFERENCES [dbo].[tbl_G00004_Rol] ([G00004_Id_Rol])
GO
ALTER TABLE [dbo].[tbl_G00005_RolPermiso] CHECK CONSTRAINT [FK_tbl_G00005_RolPermiso_tbl_G00004_Rol]
GO
ALTER TABLE [dbo].[tbl_G00005_RolPermiso]  WITH CHECK ADD  CONSTRAINT [FK_tbl_G00005_RolPermiso_tbl_G00006_Permiso] FOREIGN KEY([G00006_Id_Permiso])
REFERENCES [dbo].[tbl_G00006_Permiso] ([G00006_Id_Permiso])
GO
ALTER TABLE [dbo].[tbl_G00005_RolPermiso] CHECK CONSTRAINT [FK_tbl_G00005_RolPermiso_tbl_G00006_Permiso]
GO
