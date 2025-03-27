"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle } from "lucide-react";
import Magicdown from "@/components/Magicdown";
import { Button } from "@/components/ui/button";
import useDeepResearch from "@/hooks/useDeepResearch";
import { useTaskStore } from "@/store/task";
import { downloadFile } from "@/utils/file";

function FinalReport() {
  const { t } = useTranslation();
  const taskStore = useTaskStore();
  const { status, writeFinalReport } = useDeepResearch();
  const [isWriting, setIsWriting] = useState<boolean>(false);

  async function handleWriteFinalReport() {
    setIsWriting(true);
    await writeFinalReport();
    setIsWriting(false);
  }

  async function handleDownloadPDF() {
    const { default: printJS } = await import("print-js");
    printJS({
      printable: "final-report",
      type: "html",
      documentTitle: taskStore.title,
      targetStyles: ["prose", "max-w-full"],
    });
  }

  return (
    <section className="p-4 border rounded-md mt-4">
      <h3 className="font-semibold text-lg border-b mb-2 leading-10">
        {t("research.finalReport.title")}
      </h3>
      {taskStore.finalReport === "" ? (
        <div>{t("research.finalReport.emptyTip")}</div>
      ) : (
        <>
          <article
            id="final-report"
            className="prose prose-slate dark:prose-invert max-w-full mt-6"
          >
            <Magicdown>{taskStore.finalReport}</Magicdown>
          </article>
          <div className="grid grid-cols-3 gap-4 max-sm:gap-2 w-full border-t mt-4 pt-4">
            <Button
              variant="secondary"
              disabled={isWriting}
              onClick={() => handleWriteFinalReport()}
            >
              {isWriting ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  <span className="mx-1">{status}</span>
                </>
              ) : (
                t("research.common.rewriteReport")
              )}
            </Button>
            <Button
              onClick={() =>
                downloadFile(
                  taskStore.finalReport,
                  taskStore.title,
                  "text/markdown;charset=utf-8"
                )
              }
            >
              Markdown
            </Button>
            <Button onClick={() => handleDownloadPDF()}>PDF</Button>
          </div>
        </>
      )}
    </section>
  );
}

export default FinalReport;
