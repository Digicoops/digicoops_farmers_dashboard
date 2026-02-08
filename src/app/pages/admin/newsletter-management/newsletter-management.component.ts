import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../shared/components/ui/button/button.component';

interface Newsletter {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'scheduled' | 'sent';
  recipientsCount: number;
  openRate?: number;
  clickRate?: number;
  scheduledDate?: string;
  sentDate?: string;
  createdAt: string;
}

interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
}

@Component({
  selector: 'app-newsletter-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './newsletter-management.component.html'
})
export class NewsletterManagementComponent implements OnInit {
  newsletters: Newsletter[] = [];
  subscribers: Subscriber[] = [];
  filteredNewsletters: Newsletter[] = [];
  isLoading = false;
  activeTab: 'newsletters' | 'subscribers' = 'newsletters';
  searchTerm = '';
  showComposeModal = false;

  newNewsletter = {
    subject: '',
    content: '',
    scheduledDate: ''
  };

  ngOnInit() {
    this.loadNewsletters();
    this.loadSubscribers();
  }

  private loadNewsletters() {
    this.isLoading = true;
    
    // TODO: Remplacer par vraie API
    this.newsletters = [
      {
        id: '1',
        subject: 'Nouveaux produits de saison disponibles',
        content: 'Découvrez notre sélection de fruits et légumes frais...',
        status: 'sent',
        recipientsCount: 1250,
        openRate: 45.2,
        clickRate: 12.8,
        sentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        subject: 'Promotion spéciale - 20% de réduction',
        content: 'Profitez de notre offre exceptionnelle sur tous les produits bio...',
        status: 'scheduled',
        recipientsCount: 1250,
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        subject: 'Conseils pour conserver vos légumes',
        content: 'Nos experts partagent leurs meilleures astuces...',
        status: 'draft',
        recipientsCount: 0,
        createdAt: new Date().toISOString()
      }
    ];

    this.applyFilters();
    this.isLoading = false;
  }

  private loadSubscribers() {
    // TODO: Remplacer par vraie API
    this.subscribers = [
      {
        id: '1',
        email: 'jean.dupont@example.com',
        name: 'Jean Dupont',
        status: 'active',
        subscribedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        email: 'marie.martin@example.com',
        name: 'Marie Martin',
        status: 'active',
        subscribedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  applyFilters() {
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      this.filteredNewsletters = this.newsletters.filter(nl =>
        nl.subject.toLowerCase().includes(term) ||
        nl.content.toLowerCase().includes(term)
      );
    } else {
      this.filteredNewsletters = [...this.newsletters];
    }
  }

  onSearch() {
    this.applyFilters();
  }

  switchTab(tab: 'newsletters' | 'subscribers') {
    this.activeTab = tab;
  }

  openComposeModal() {
    this.newNewsletter = {
      subject: '',
      content: '',
      scheduledDate: ''
    };
    this.showComposeModal = true;
  }

  closeComposeModal() {
    this.showComposeModal = false;
  }

  saveNewsletter(asDraft: boolean = false) {
    console.log('Nouvelle newsletter:', this.newNewsletter, 'Draft:', asDraft);
    // TODO: Implémenter sauvegarde API
    this.closeComposeModal();
    this.loadNewsletters();
  }

  sendNewsletter(newsletter: Newsletter) {
    if (confirm(`Envoyer la newsletter "${newsletter.subject}" à ${this.getActiveSubscribers()} abonnés ?`)) {
      console.log('Envoi newsletter:', newsletter);
      // TODO: Implémenter envoi API
      this.loadNewsletters();
    }
  }

  deleteNewsletter(newsletter: Newsletter) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la newsletter "${newsletter.subject}" ?`)) {
      console.log('Suppression newsletter:', newsletter);
      // TODO: Implémenter suppression API
      this.loadNewsletters();
    }
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'sent': 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'scheduled': 'Programmée',
      'sent': 'Envoyée'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalNewsletters(): number {
    return this.newsletters.length;
  }

  getSentNewsletters(): number {
    return this.newsletters.filter(nl => nl.status === 'sent').length;
  }

  getActiveSubscribers(): number {
    return this.subscribers.filter(sub => sub.status === 'active').length;
  }

  getAverageOpenRate(): number {
    const sent = this.newsletters.filter(nl => nl.status === 'sent' && nl.openRate);
    if (sent.length === 0) return 0;
    return sent.reduce((sum, nl) => sum + (nl.openRate || 0), 0) / sent.length;
  }
}
