export interface FileUploadParams {
  mode: 'basic' | 'advanced' | undefined;
  name: string;
  chooseIcon: string;
  url: string;
  accept: string;
  maxFileSize: number;
  auto: boolean;
  chooseLabel: string;
  onUpload: (event: any) => void;
  styleClass: string;
}
