ALTER TABLE "analysis_results"
ADD COLUMN IF NOT EXISTS "model_source" TEXT;

UPDATE "analysis_results"
SET "model_source" = 'openrouter'
WHERE "model_source" IS NULL OR trim("model_source") = '';

ALTER TABLE "analysis_results"
ALTER COLUMN "model_source" SET DEFAULT 'openrouter';

ALTER TABLE "analysis_results"
ALTER COLUMN "model_source" SET NOT NULL;

DROP INDEX IF EXISTS "analysis_results_scan_id_key";

CREATE UNIQUE INDEX IF NOT EXISTS "analysis_results_scan_id_model_source_key"
ON "analysis_results"("scan_id", "model_source");
