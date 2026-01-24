import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {InputFieldComponent} from "../../shared/components/form/input/input-field.component";
import {LabelComponent} from "../../shared/components/form/label/label.component";
import {SelectComponent} from "../../shared/components/form/select/select.component";
import {TextAreaComponent} from "../../shared/components/form/input/text-area.component";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";
import {PageBreadcrumbComponent} from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {Router} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {PhoneInputComponent} from "../../shared/components/form/group-input/phone-input/phone-input.component";
import {
  AgriculturalProducerManagementService
} from "../../core/services/producer/agricultural-producer-management.service";
import {ModalComponent} from "../../shared/components/ui/modal/modal.component";
import {
  ImportProducerModalComponent
} from "../../shared/components/import-producer-modal/import-producer-modal.component";

interface Option {
  value: string;
  label: string;
}

@Component({
  selector: 'app-add-producer-form',
  imports: [
    CommonModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    PageBreadcrumbComponent,
    FormsModule,
    PhoneInputComponent,
    ModalComponent,
    ImportProducerModalComponent
  ],
  templateUrl: './add-producer.component.html',
  styles: ``,
  standalone: true
})
export class AddProducerComponent {
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Champs du formulaire
  fname = '';
  lname = '';
  phone = '';
  farmName = '';
  location = '';
  description = '';
  password = '';

  // Sélections
  selectedProductionType = '';
  selectedAccountStatus = 'active';

  // Options pour les selects
  productionTypes: Option[] = [
    { value: 'vegetables', label: 'Légumes' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'cereals', label: 'Céréales' },
    { value: 'livestock', label: 'Élevage' },
    { value: 'dairy', label: 'Produits laitiers' },
    { value: 'poultry', label: 'Volaille' },
    { value: 'mixed', label: 'Polyculture' },
    { value: 'organic', label: 'Agriculture biologique' }
  ];

  accountStatuses: Option[] = [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
    { value: 'pending', label: 'En attente' }
  ];

  countries = [{ code: 'SN', label: '+221' }];
  isOpen: boolean = false;

  constructor(
      private router: Router,
      private producerManagement: AgriculturalProducerManagementService
  ) {}

  ngOnInit() {}

  handleProductionTypeChange(value: string) {
    this.selectedProductionType = value;
  }

  handleAccountStatusChange(value: string) {
    this.selectedAccountStatus = value;
  }

  handlePhoneNumberChange(phoneNumber: string) {
    this.phone = phoneNumber;
  }

  togglePasswordVisibility() {
    if (!this.isLoading) {
      this.showPassword = !this.showPassword;
    }
  }

  // Validation du formulaire
  isFormValid(): boolean {
    return !!this.fname?.trim() &&
        !!this.lname?.trim() &&
        !!this.farmName?.trim() &&
        !!this.password &&
        this.password.length >= 8;
  }

  async onSubmit() {
    // Vérifier d'abord les permissions
    const permissionCheck = await this.producerManagement.checkUserPermissions();
    if (!permissionCheck.hasPermission) {
      this.errorMessage = permissionCheck.error || 'Action non autorisée';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const producerData = {
      first_name: this.fname.trim(),
      last_name: this.lname.trim(),
      phone: this.phone || '',
      farm_name: this.farmName.trim(),
      location: this.location.trim(),
      production_type: this.selectedProductionType,
      description: this.description.trim(),
      password: this.password,
      account_status: this.selectedAccountStatus
    };

    try {
      const result = await this.producerManagement.createProducer(producerData);

      if (result.success) {
        if (result.needsEmailConfirmation) {
          this.successMessage = 'Producteur créé avec succès ! Un email de confirmation a été envoyé.';
        } else {
          this.successMessage = 'Producteur créé avec succès ! Redirection...';
        }

        setTimeout(() => {
          this.producerManagement.navigateAfterSuccess(result.producerId);
        }, 3000);
      } else {
        this.errorMessage = result.error || 'Erreur lors de la création du producteur';
      }
    } catch (error) {
      this.errorMessage = 'Une erreur inattendue est survenue.';
      console.error('Erreur création producteur:', error);
    } finally {
      this.isLoading = false;
    }
  }


  onCancel() {
    this.producerManagement.navigateToProducersList();
  }

  private async simulateApiCall(data: any): Promise<void> {
    // Simulation d'un appel API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  }

  private getErrorMessage(error: any): string {
    const errorMap: { [key: string]: string } = {
      'User already registered': 'Un compte existe déjà avec cet email.',
      'Invalid email': 'Adresse email invalide.',
      'Weak password': 'Le mot de passe est trop faible.',
      'Network error': 'Erreur de connexion. Vérifiez votre internet.'
    };

    return errorMap[error] || error?.message || 'Erreur lors de la création du producteur.';
  }

  // Ajoutez cette méthode
// Modifiez cette méthode pour gérer les erreurs aussi
//   onImportComplete(result: any) {
//     console.log('Import terminé:', result);
//
//     if (result.failed > 0) {
//       // Gérer les erreurs d'importation
//       if (result.failed === result.total) {
//         // Tous les imports ont échoué
//         this.errorMessage = `L'importation a échoué pour tous les ${result.total} producteur(s).`;
//       } else {
//         // Certains ont réussi, certains ont échoué
//         this.errorMessage = `${result.success} producteur(s) importé(s) avec succès, ${result.failed} échec(s).`;
//       }
//
//       // Vous pouvez aussi afficher les détails des erreurs
//       if (result.failedDetails?.length > 0) {
//         console.log('Détails des échecs:', result.failedDetails);
//         // Option: afficher la première erreur dans le message
//         const firstError = result.failedDetails[0];
//         this.errorMessage += ` Erreur: ${firstError.error}`;
//       }
//     }
//
//     if (result.success > 0) {
//       this.successMessage = `${result.success} producteur(s) importé(s) avec succès !`;
//     }
//   }

  openModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
  }

  // Ajoutez ces propriétés
  importResult: any = null;
  showImportResultModal = false;

// Modifiez onImportComplete
  onImportComplete(result: any) {
    console.log('Import terminé:', result);
    this.importResult = result;

    // Ouvrir le modal de résultats dans le parent
    this.showImportResultModal = true;

    if (result.success > 0) {
      this.successMessage = `${result.success} producteur(s) importé(s) avec succès !`;
    }

    if (result.failed > 0) {
      if (result.failed === result.total) {
        this.errorMessage = `L'importation a échoué pour tous les ${result.total} producteur(s).`;
      } else {
        this.errorMessage = `${result.success} producteur(s) importé(s) avec succès, ${result.failed} échec(s).`;
      }
    }
  }

// Méthode pour fermer le modal
  closeImportResultModal() {
    this.showImportResultModal = false;
    this.importResult = null;
  }

  navigateToProducersList() {
    this.router.navigate(['/dashboard/list-producers']);
  }

}