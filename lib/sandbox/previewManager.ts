export interface PreviewStatus {
  success: boolean;
  previewUrl?: string;
  message?: string;
}

/**
 * Returns the URL of the in-process Next.js preview route for this project.
 * The actual rendering happens in /app/api/preview/[projectId]/route.ts which
 * reads the sandbox files and serves a self-contained HTML page.
 */
export async function preparePreview(projectId: string): Promise<PreviewStatus> {
  try {
    // The preview is served by the Next.js route handler at runtime.
    // No separate process or port allocation is needed.
    return {
      success: true,
      previewUrl: `/api/preview/${encodeURIComponent(projectId)}`,
      message: "Preview route ready.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to prepare preview environment.",
    };
  }
}
