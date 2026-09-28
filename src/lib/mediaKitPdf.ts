import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Capacitor } from "@capacitor/core";

/** Render an element to a multi-page A4 PDF; share it on native, download it on web. */
export const exportMediaKitPdf = async (el: HTMLElement, fileName: string) => {
  // Render the full scrollable content, not just the visible part.
  const prev = { h: el.style.height, o: el.style.overflow, f: el.style.flex };
  el.style.height = "auto"; el.style.overflow = "visible"; el.style.flex = "none";
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, {
      scale: 2, useCORS: true, backgroundColor: getComputedStyle(document.body).backgroundColor || null,
      windowWidth: el.scrollWidth,
    });
  } finally {
    el.style.height = prev.h; el.style.overflow = prev.o; el.style.flex = prev.f;
  }

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const pxPerPage = Math.floor((canvas.width * pageH) / pageW);
  for (let y = 0, page = 0; y < canvas.height; y += pxPerPage, page++) {
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.min(pxPerPage, canvas.height - y);
    slice.getContext("2d")!.drawImage(canvas, 0, y, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    if (page > 0) pdf.addPage();
    pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, (slice.height * pageW) / canvas.width);
  }

  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const base64 = pdf.output("datauristring").split(",")[1];
    const saved = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
    await Share.share({ title: fileName, url: saved.uri, dialogTitle: "Share your media kit" });
  } else {
    pdf.save(fileName);
  }
};
