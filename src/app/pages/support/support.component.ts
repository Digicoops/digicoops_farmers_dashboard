import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {InputFieldComponent} from "../../shared/components/form/input/input-field.component";
import {LabelComponent} from "../../shared/components/form/label/label.component";
import {SelectComponent} from "../../shared/components/form/select/select.component";
import {TextAreaComponent} from "../../shared/components/form/input/text-area.component";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";
import {PageBreadcrumbComponent} from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {
  UserAddressCardComponent
} from "../../shared/components/user-profile/user-address-card/user-address-card.component";
import {UserInfoCardComponent} from "../../shared/components/user-profile/user-info-card/user-info-card.component";
import {UserMetaCardComponent} from "../../shared/components/user-profile/user-meta-card/user-meta-card.component";
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {PhoneInputComponent} from "../../shared/components/form/group-input/phone-input/phone-input.component";
import {
  AgriculturalProducerManagementService
} from "../../core/services/producer/agricultural-producer-management.service";

interface Option {
  value: string;
  label: string;
}

@Component({
  selector: 'app-support',
  imports: [
    CommonModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    PageBreadcrumbComponent,
    FormsModule,
    PhoneInputComponent
  ],
  templateUrl: './support.component.html',
  styles: ``
})
export class SupportComponent {


}