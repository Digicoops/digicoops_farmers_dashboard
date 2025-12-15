import { CommonModule } from '@angular/common';
import {Component, OnInit} from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from "../../form/group-input/phone-input/phone-input.component";
import { AuthManagementService } from "../../../../core/services/auth/auth-managment.service";
import {AuthService} from "../../../../core/services/auth/auth.service";

@Component({
  selector: 'app-send-link-message-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    PhoneInputComponent,
  ],
  templateUrl: './send-link-message-form.component.html',
  styles: ``,
  standalone: true
})

export class SendLinkMessageFormComponent implements OnInit {
  // Types de messages supportés
  messageType: 'reset-password' | 'account-created' | 'account-not-activated' = 'reset-password';

  // État du composant
  isLoading = false;

  constructor(
      private router: Router,
      private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer le type depuis les données de route
    this.activatedRoute.data.subscribe((data:any) => {
      this.messageType = data['messageType'] || 'reset-password';
      console.log('SendLinkMessageFormComponent initialized with type:', this.messageType);
    });
  }

  // Texte et configuration selon le type
  get messageConfig() {
    const configs = {
      'reset-password': {
        title: 'Vérifiez votre boîte mail',
        message: 'Un mail de modification de mot de passe vous a été envoyé pour réinitialiser votre mot de passe.',
        buttonText: 'Ouvrir ma boîte mail',
        icon: 'mail'
      },
      'account-created': {
        title: 'Compte créé avec succès',
        message: 'Votre compte a été créé avec succès. Validez la création en cliquant sur le mail qui vous a été envoyé pour activer le compte.',
        buttonText: 'Ouvrir ma boîte mail',
        icon: 'mail'
      },
      'account-not-activated': {
        title: 'Compte non activé',
        message: 'Vous n\'avez pas activé votre compte après sa création.',
        buttonText: 'Renvoyer le lien d\'activation',
        icon: 'refresh'
      }
    };

    return configs[this.messageType];
  }

  // Action principale du bouton
  onPrimaryAction() {
    const config = this.messageConfig;

    if (this.messageType === 'account-not-activated') {
      this.resendActivationLink();
    } else {
      this.openEmailClient();
    }
  }

  // Ouvrir le client email
  openEmailClient() {
    // Ouvrir le client email par défaut
    // window.location.href = 'mailto:';
    window.open('https://mail.google.com/mail/u/0/', '_blank');

  }



  // Renvoyer le lien d'activation
  resendActivationLink() {
    this.isLoading = true;

    // Implémentez ici la logique pour renvoyer le lien d'activation
    console.log('Renvoyer le lien d\'activation...');

    // Simulation d'appel API
    setTimeout(() => {
      this.isLoading = false;
      // Vous pouvez ajouter un message de succès ici
    }, 2000);
  }

  // Contacter le support
  contactSupport() {
    window.location.href = 'mailto:support@digicoop.com?subject=Assistance - ' + this.messageConfig.title;
  }

  // Retour à la page précédente
  goBack() {
    this.router.navigate(['/login']);
  }

  // Aller à la page d'accueil
  goHome() {
    this.router.navigate(['/']);
  }
}