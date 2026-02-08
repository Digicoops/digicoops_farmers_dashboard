import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import {AddProductFormComponent} from "./pages/add-product-form/add-product-form.component";
import {ProductListTableComponent} from "./pages/product-list-table/product-list-table.component";
import {RecentOrdersComponent} from "./pages/recent-orders/recent-orders.component";
import {BillingInvoiceTableComponent} from "./pages/billing/billing-invoice-table/billing-invoice-table.component";
import {OrderHistoryComponent} from "./pages/transactions-orders/order-history/order-history.component";
import {TransactionHeaderComponent} from "./pages/transactions-orders/transaction-header/transaction-header.component";
import {OrderDetailsTableComponent} from "./pages/transactions-orders/order-details-table/order-details-table.component";
import {AuthGuard} from "./core/guard/auth.guard";
import {ComingSoonComponent} from "./pages/auth-pages/coming-soon/coming-soon.component";
import {AddProducerComponent} from "./pages/add-producer/add-producer.component";
import {ListProducersComponent} from "./pages/list-producers/list-producers.component";
import {ViewProductComponent} from "./pages/view-product/view-product.component";
import {EditProductComponent} from "./pages/edit-product/edit-product.component";
import {SupportComponent} from "./pages/support/support.component";
import {cooperativeGuard} from "./core/guard/cooperative.guard";
import {ResetPasswordComponent} from "./pages/auth-pages/reset-password/reset-password.component";
import {ChangePasswordComponent} from "./pages/auth-pages/change-password/change-password.component";
import {SendLinkMessageComponent} from "./pages/auth-pages/send-link-password/send-link-message.component";
import {AddCustomProductForm} from "./pages/add-custom-product-form/add-custom-product-form.component";
import {EditCustomProduct} from "./pages/edit-custom-product/edit-custom-product.component";
import {AdminSignInComponent} from "./pages/admin-auth/admin-sign-in/admin-sign-in.component";
import {AdminSignUpComponent} from "./pages/admin-auth/admin-sign-up/admin-sign-up.component";
import {adminGuard} from "./core/guard/admin.guard";
import {UsersManagementComponent} from "./pages/admin/users-management/users-management.component";
import {SystemSettingsComponent} from "./pages/admin/system-settings/system-settings.component";
import {CategoryManagementComponent} from "./pages/admin/category-management/category-management.component";
import {NewsletterManagementComponent} from "./pages/admin/newsletter-management/newsletter-management.component";
import {PersonalInfoSettingsComponent} from "./pages/admin/settings/personal-info-settings/personal-info-settings.component";
import {NotificationsSettingsComponent} from "./pages/admin/settings/notifications-settings/notifications-settings.component";
import {FinancesSettingsComponent} from "./pages/admin/settings/finances-settings/finances-settings.component";
import {OrdersManagementComponent} from "./pages/orders/orders-management/orders-management.component";
import {InventoryManagementComponent} from "./pages/inventory/inventory-management/inventory-management.component";
import {SalesReportsComponent} from "./pages/reports/sales-reports/sales-reports.component";

export const routes: Routes = [
  {
    path:'dashboard',
    component:AppLayoutComponent,
    children:[
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title:
          'Angular Ecommerce Dashboard | Digicoop- Angular Admin Dashboard Template',
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Angular Calender | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'profile',
        component:ProfileComponent,
        title:'Angular Profile Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'form-elements',
        component:FormElementsComponent,
        title:'Angular Form Elements Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'basic-tables',
        component:BasicTablesComponent,
        title:'Angular Basic Tables Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Angular Blank Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      // support tickets
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Invoice Details Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'line-chart',
        component:LineChartComponent,
        title:'Angular Line Chart Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'bar-chart',
        component:BarChartComponent,
        title:'Angular Bar Chart Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Angular Alerts Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'avatars',
        component:AvatarElementComponent,
        title:'Angular Avatars Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'badge',
        component:BadgesComponent,
        title:'Angular Badges Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'add-product',
        component:AddProductFormComponent,
        title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'add-custom-product',
        component:AddCustomProductForm,
        title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'list-product',
        component:ProductListTableComponent,
        title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'list-orders',
        component:RecentOrdersComponent,
        title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'invoice',
        component:InvoicesComponent,
        title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'billing',
        component:BillingInvoiceTableComponent,
        title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
      },

      {
        path:'buttons',
        component:ButtonsComponent,
        title:'Angular Buttons Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'images',
        component:ImagesComponent,
        title:'Angular Images Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'videos',
        component:VideosComponent,
        title:'Angular Videos Dashboard | Digicoop- Angular Admin Dashboard Template'
      },
      {
        path:'add-producer',
        component:AddProducerComponent,
        title:'Tableau de bord DIGICOOP | Ajouter un producteur'
      },
      {
        path:'list-producers',
        component:ListProducersComponent,
        title:'Tableau de bord DIGICOOP | Listes des producteurs',
      },
      {
        path:'view-product/:id',
        component:ViewProductComponent,
        title:'Tableau de bord DIGICOOP | Voir le produit'
      },
      {
        path:'edit-product/:id',
        component:EditProductComponent,
        title:'Tableau de bord DIGICOOP | Modifier un produit'
      },
      {
        path:'edit-custom-product/:id',
        component:EditCustomProduct,
        title:'Tableau de bord DIGICOOP | Modifier un produit'
      },
      {
        path:'support',
        component:SupportComponent,
        title:'Tableau de bord DIGICOOP | Modifier un produit'
      },
      {
        path:'admin/users',
        component:UsersManagementComponent,
        title:'Gestion des utilisateurs | Digicoop Admin',
        canActivate: [adminGuard]
      },
      {
        path:'admin/categories',
        component:CategoryManagementComponent,
        title:'Gestion des catégories | Digicoop Admin',
        canActivate: [adminGuard]
      },
      {
        path:'admin/newsletters',
        component:NewsletterManagementComponent,
        title:'Gestion des newsletters | Digicoop Admin',
        canActivate: [adminGuard]
      },
      {
        path:'admin/settings',
        component:SystemSettingsComponent,
        title:'Paramètres système | Digicoop Admin',
        canActivate: [adminGuard]
      },
      {
        path:'admin/settings/personal-info',
        component:PersonalInfoSettingsComponent,
        title:'Personal Information | Digicoop Admin',
        canActivate: [adminGuard]
      },
      {
        path:'admin/settings/notifications',
        component:NotificationsSettingsComponent,
        title:'Notifications | Digicoop Admin',
        canActivate: [adminGuard]
      },
      {
        path:'admin/settings/finances',
        component:FinancesSettingsComponent,
        title:'Finances | Digicoop Admin',
        canActivate: [adminGuard]
      },
      {
        path:'orders',
        component:OrdersManagementComponent,
        title:'Gestion des commandes | Digicoop'
      },
      {
        path:'inventory',
        component:InventoryManagementComponent,
        title:'Gestion des stocks | Digicoop'
      },
      {
        path:'reports',
        component:SalesReportsComponent,
        title:'Rapports de ventes | Digicoop'
      },
    ],
    canActivate: [AuthGuard],
  },
  // auth pages

  {
    path:'login',
    component:SignInComponent,
    title:'Angular Sign In Dashboard | Digicoop- Angular Admin Dashboard Template',
  },
  {
    path:'reset-password',
    component:ResetPasswordComponent,
    title:'Angular Sign In Dashboard | Digicoop- Angular Admin Dashboard Template',
  },
  // Routes Admin
  {
    path:'admin/login',
    component:AdminSignInComponent,
    title:'Admin Login | Digicoop- Angular Admin Dashboard Template'
  },
  {
    path:'admin/register',
    component:AdminSignUpComponent,
    title:'Admin Register | Digicoop- Angular Admin Dashboard Template'
  },
  {
    path: 'admin/account-created',
    component: SendLinkMessageComponent,
    data: {
      messageType: 'account-created',
      title: 'Compte admin créé avec succès'
    }
  },

  {
    path:'',
    component:SignInComponent,
    title:'Angular Sign In Dashboard | Digicoop- Angular Admin Dashboard Template'
  },
  {
    path:'register',
    component:SignUpComponent,
    title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
  },
  {
    path:'update-password',
    component:ChangePasswordComponent,
    title:'Angular Change password Dashboard | Digicoop - Angular Admin Dashboard Template'
  },
  {
    path:'coming-soon',
    component:ComingSoonComponent,
    title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
  },

  {
    path: 'reset-password-sent',
    component: SendLinkMessageComponent,
    data: {
      messageType: 'reset-password',
      title: 'Email de réinitialisation envoyé'
    }
  },
  // Page de compte créé
  {
    path: 'account-created',
    component: SendLinkMessageComponent,
    data: {
      messageType: 'account-created',
      title: 'Compte créé avec succès'
    }
  },
  // Page de compte non activé
  {
    path: 'account-not-activated',
    component: SendLinkMessageComponent,
    data: {
      messageType: 'account-not-activated',
      title: 'Compte non activé'
    }
  },

  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | Digicoop- Angular Admin Dashboard Template'
  },
];
