-- Defesa em profundidade para o Supabase: as tabelas do schema public ficam
-- expostas pela Data API (PostgREST). Com RLS ligado e sem políticas, os papéis
-- anon/authenticated não leem nem escrevem nada. O app (Prisma) conecta como
-- dono das tabelas, que ignora RLS, então nada muda para o site.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductFile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChangelogEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Key" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redemption" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DownloadLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
