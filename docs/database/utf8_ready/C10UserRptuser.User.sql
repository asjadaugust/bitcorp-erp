USE [dbBitCorp]
GO
/****** Object:  User [C10UserRptuser]    Script Date: 3/4/2026 11:33:42 AM ******/
CREATE USER [C10UserRptuser] FOR LOGIN [C10UserRpt] WITH DEFAULT_SCHEMA=[dbo]
GO
ALTER ROLE [db_datareader] ADD MEMBER [C10UserRptuser]
GO
