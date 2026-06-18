import type { DataSourceId, RequestContext } from "@/types/api";

export interface ServiceOptions extends RequestContext {
  /** 指定單次請求的首選來源；未指定時由 registry 依設定選擇。 */
  preferredSource?: DataSourceId;
  /** 首選來源失敗時是否允許使用替代來源。 */
  allowFallback?: boolean;
}
