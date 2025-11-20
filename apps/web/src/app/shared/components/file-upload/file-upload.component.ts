import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FileUploadModule } from 'primeng/fileupload';
import { FileUploadParams } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-file-upload',
  imports: [FileUploadModule],
  template: `<p-fileupload
    [mode]="fileUploadParams.mode"
    [name]="fileUploadParams.name"
    [chooseIcon]="fileUploadParams.chooseIcon"
    [url]="fileUploadParams.url"
    [accept]="fileUploadParams.accept"
    [maxFileSize]="fileUploadParams.maxFileSize"
    (onUpload)="fileUploadParams.onUpload($event)"
    [auto]="fileUploadParams.auto"
    [chooseLabel]="fileUploadParams.chooseLabel"
    [styleClass]="fileUploadParams.styleClass"
  />`,
  styleUrls: ['./file-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileUploadComponent {
  @Input() fileUploadParams: FileUploadParams;
}
