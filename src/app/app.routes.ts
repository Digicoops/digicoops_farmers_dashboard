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
        title:'Tableau de bord DIGICOOP | Listes des producteurs'
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
        path:'support',
        component:SupportComponent,
        title:'Tableau de bord DIGICOOP | Modifier un produit'
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
    path:'coming-soon',
    component:ComingSoonComponent,
    title:'Angular Sign Up Dashboard | Digicoop- Angular Admin Dashboard Template'
  },

  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Angular NotFound Dashboard | Digicoop- Angular Admin Dashboard Template'
  },
];
