import { CommonModule } from '@angular/common';
import {
    Component,
    ElementRef,
    QueryList,
    ViewChildren,
    ChangeDetectorRef,
    inject,
    OnDestroy,
    OnInit
} from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarWidgetComponent } from './app-sidebar-widget.component';
import { combineLatest, Subscription } from 'rxjs';
import { AuthManagementService } from "../../../core/services/auth/auth-managment.service";
import {AuthService} from "../../../core/services/auth/auth.service";
import {User} from "@supabase/supabase-js";

type NavItem = {
    name: string;
    icon: string;
    path?: string;
    new?: boolean;
    subItems?: { name: string; path: string; pro?: boolean; new?: boolean; icon?: string }[];
};

@Component({
    selector: 'app-sidebar',
    imports: [
        CommonModule,
        RouterModule,
        SafeHtmlPipe,
        SidebarWidgetComponent
    ],
    templateUrl: './app-sidebar.component.html',
    standalone: true
})
export class AppSidebarComponent implements OnInit, OnDestroy {
    private authManagement = inject(AuthManagementService);
    private authService = inject(AuthService);
    private subscription = new Subscription();

    userProfile!: User;
    isCooperative = false;
    isAdmin = false;
    navItems: NavItem[] = []; // Utiliser un tableau simple, pas un observable

    private readonly baseNavItems: NavItem[] = [
        {
            icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`,
            name: "Tableau de bord",
            path: "/dashboard"
        },
        {
            name: "Produits",
            icon: `<svg width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14.0003 24.5898V24.5863M14.0003 12.8684V24.5863M9.06478 16.3657V10.6082M18.9341 5.67497C18.9341 5.67497 12.9204 8.68175 9.06706 10.6084M23.5913 8.27989C23.7686 8.55655 23.8679 8.88278 23.8679 9.2241V18.7779C23.8679 19.4407 23.4934 20.0467 22.9005 20.3431L14.7834 24.4015C14.537 24.5248 14.2686 24.5864 14.0003 24.5863M23.5913 8.27989L14.7834 12.6837C14.2908 12.93 13.7109 12.93 13.2182 12.6837L4.41037 8.27989M23.5913 8.27989C23.4243 8.01927 23.1881 7.80264 22.9005 7.65884L14.7834 3.60044C14.2908 3.35411 13.7109 3.35411 13.2182 3.60044L5.10118 7.65884C4.81359 7.80264 4.57737 8.01927 4.41037 8.27989M4.41037 8.27989C4.23309 8.55655 4.13379 8.88278 4.13379 9.2241V18.7779C4.13379 19.4407 4.5083 20.0467 5.10118 20.3431L13.2182 24.4015C13.4644 24.5246 13.7324 24.5862 14.0003 24.5863" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
            subItems: [
                {
                    name: "Ajouter un produit agricol",
                    icon: `<svg width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" ><path d="M10.5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3M17.5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3M15 13v-3h3V8h-3V5h-2v3h-3v2h3v3z"></path><path d="M8.82 15.77c.31.75 1.04 1.23 1.85 1.23h6.18c.79 0 1.51-.47 1.83-1.2L21.66 9h-2.18l-2.62 6h-6.18L5.92 3.62C5.76 3.25 5.4 3 5 3H2v2h2.33z"></path></svg>`,
                    path: '/dashboard/add-product'
                },

                {
                    name: "Ajouter un service ou du matériel agricole",
                    icon: `<svg width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" ><path d="M10.5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3M17.5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3M15 13v-3h3V8h-3V5h-2v3h-3v2h3v3z"></path><path d="M8.82 15.77c.31.75 1.04 1.23 1.85 1.23h6.18c.79 0 1.51-.47 1.83-1.2L21.66 9h-2.18l-2.62 6h-6.18L5.92 3.62C5.76 3.25 5.4 3 5 3H2v2h2.33z"></path></svg>`,
                    path: '/dashboard/add-custom-product'
                },
                {
                    name: "Liste des produits, services et matériels agricoles",
                    icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H18.5001C19.7427 20.75 20.7501 19.7426 20.7501 18.5V5.5C20.7501 4.25736 19.7427 3.25 18.5001 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H18.5001C18.9143 4.75 19.2501 5.08579 19.2501 5.5V18.5C19.2501 18.9142 18.9143 19.25 18.5001 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V5.5ZM6.25005 9.7143C6.25005 9.30008 6.58583 8.9643 7.00005 8.9643L17 8.96429C17.4143 8.96429 17.75 9.30008 17.75 9.71429C17.75 10.1285 17.4143 10.4643 17 10.4643L7.00005 10.4643C6.58583 10.4643 6.25005 10.1285 6.25005 9.7143ZM6.25005 14.2857C6.25005 13.8715 6.58583 13.5357 7.00005 13.5357H17C17.4143 13.5357 17.75 13.8715 17.75 14.2857C17.75 14.6999 17.4143 15.0357 17 15.0357H7.00005C6.58583 15.0357 6.25005 14.6999 6.25005 14.2857Z" fill="currentColor"></path></svg>`,
                    path: '/dashboard/list-product'
                },
                {
                    name: "Listes des commandes",
                    icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H18.5001C19.7427 20.75 20.7501 19.7426 20.7501 18.5V5.5C20.7501 4.25736 19.7427 3.25 18.5001 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H18.5001C18.9143 4.75 19.2501 5.08579 19.2501 5.5V18.5C19.2501 18.9142 18.9143 19.25 18.5001 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V5.5ZM6.25005 9.7143C6.25005 9.30008 6.58583 8.9643 7.00005 8.9643L17 8.96429C17.4143 8.96429 17.75 9.30008 17.75 9.71429C17.75 10.1285 17.4143 10.4643 17 10.4643L7.00005 10.4643C6.58583 10.4643 6.25005 10.1285 6.25005 9.7143ZM6.25005 14.2857C6.25005 13.8715 6.58583 13.5357 7.00005 13.5357H17C17.4143 13.5357 17.75 13.8715 17.75 14.2857C17.75 14.6999 17.4143 15.0357 17 15.0357H7.00005C6.58583 15.0357 6.25005 14.6999 6.25005 14.2857Z" fill="currentColor"></path></svg>`,
                    path: '/dashboard/list-orders'
                },
            ],
        },
    ];

    private readonly adminMenu: NavItem = {
        name: "Administration",
        icon: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.5 16 12.1 16 12.7V16.7C16 17.4 15.4 17.9 14.7 17.9H9.2C8.6 17.9 8 17.4 8 16.8V12.8C8 12.1 8.6 11.6 9.2 11.6V10C9.2 8.6 10.6 7 12 7M12 8.2C11.2 8.2 10.5 8.7 10.5 10V11.5H13.5V10C13.5 8.7 12.8 8.2 12 8.2Z" /></svg>`,
        subItems: [
            {
                name: "Tableau de bord admin",
                icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V8.99998C3.25 10.2426 4.25736 11.25 5.5 11.25H9C10.2426 11.25 11.25 10.2426 11.25 8.99998V5.5C11.25 4.25736 10.2426 3.25 9 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H9C9.41421 4.75 9.75 5.08579 9.75 5.5V8.99998C9.75 9.41419 9.41421 9.74998 9 9.74998H5.5C5.08579 9.74998 4.75 9.41419 4.75 8.99998V5.5ZM5.5 12.75C4.25736 12.75 3.25 13.7574 3.25 15V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H9C10.2426 20.75 11.25 19.7427 11.25 18.5V15C11.25 13.7574 10.2426 12.75 9 12.75H5.5ZM4.75 15C4.75 14.5858 5.08579 14.25 5.5 14.25H9C9.41421 14.25 9.75 14.5858 9.75 15V18.5C9.75 18.9142 9.41421 19.25 9 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V15ZM12.75 5.5C12.75 4.25736 13.7574 3.25 15 3.25H18.5C19.7426 3.25 20.75 4.25736 20.75 5.5V8.99998C20.75 10.2426 19.7426 11.25 18.5 11.25H15C13.7574 11.25 12.75 10.2426 12.75 8.99998V5.5ZM15 4.75C14.5858 4.75 14.25 5.08579 14.25 5.5V8.99998C14.25 9.41419 14.5858 9.74998 15 9.74998H18.5C18.9142 9.74998 19.25 9.41419 19.25 8.99998V5.5C19.25 5.08579 18.9142 4.75 18.5 4.75H15ZM15 12.75C13.7574 12.75 12.75 13.7574 12.75 15V18.5C12.75 19.7426 13.7574 20.75 15 20.75H18.5C19.7426 20.75 20.75 19.7427 20.75 18.5V15C20.75 13.7574 19.7426 12.75 18.5 12.75H15ZM14.25 15C14.25 14.5858 14.5858 14.25 15 14.25H18.5C18.9142 14.25 19.25 14.5858 19.25 15V18.5C19.25 18.9142 18.9142 19.25 18.5 19.25H15C14.5858 19.25 14.25 18.9142 14.25 18.5V15Z" fill="currentColor"></path></svg>`,
                path: '/dashboard/admin'
            },
            {
                name: "Liste des utilisateurs",
                icon: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4C13.66 4 15 5.34 15 7C15 8.66 13.66 10 12 10C10.34 10 9 8.66 9 7C9 5.34 10.34 4 12 4M12 14C16.42 14 20 15.79 20 18V20H4V18C4 15.79 7.58 14 12 14Z" /></svg>`,
                path: '/dashboard/admin/users'
            },
            {
                name: "Gestion des commandes",
                icon: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24"><path d="M19 7H18V6A4 4 0 0 0 10 6V7H9A1 1 0 0 0 8 8V20A1 1 0 0 0 9 21H19A1 1 0 0 0 20 20V8A1 1 0 0 0 19 7M12 6A2 2 0 0 1 16 6V7H12V6M18 19H10V9H18V19Z" /></svg>`,
                path: '/dashboard/admin/orders'
            },
            {
                name: "Paramètres système",
                icon: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24"><path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" /></svg>`,
                path: '/dashboard/admin/settings'
            }
        ],
    };

    private readonly producerMenu: NavItem = {
        name: "Producteurs",
        icon: `<svg width="1em" height="1em" fill="currentColor" viewBox="0 0 24 24" transform="" id="injected-svg"><path d="m12,11c1.71,0,3-1.29,3-3s-1.29-3-3-3-3,1.29-3,3,1.29,3,3,3Zm0-4c.6,0,1,.4,1,1s-.4,1-1,1-1-.4-1-1,.4-1,1-1Z"></path><path d="m13,12h-2c-2.76,0-5,2.24-5,5v.5c0,.83.67,1.5,1.5,1.5h9c.83,0,1.5-.67,1.5-1.5v-.5c0-2.76-2.24-5-5-5Zm-5,5c0-1.65,1.35-3,3-3h2c1.65,0,3,1.35,3,3h-8Z"></path><path d="m6.5,11c.47,0,.9-.12,1.27-.33-.48-.77-.77-1.68-.77-2.67,0-.66.13-1.28.35-1.85-.26-.09-.55-.15-.85-.15-1.44,0-2.5,1.06-2.5,2.5s1.06,2.5,2.5,2.5Z"></path><path d="m6.11,12h-.61c-1.93,0-3.5,1.57-3.5,3.5v1c0,.28.22.5.5.5h1.5c0-1.96.81-3.73,2.11-5Z"></path><path d="m17.5,11c1.44,0,2.5-1.06,2.5-2.5s-1.06-2.5-2.5-2.5c-.31,0-.59.06-.85.15.22.57.35,1.19.35,1.85,0,.99-.29,1.9-.77,2.67.37.21.79.33,1.27.33Z"></path><path d="m18.5,12h-.61c1.3,1.27,2.11,3.04,2.11,5h1.5c.28,0,.5-.22.5-.5v-1c0-1.93-1.57-3.5-3.5-3.5Z"></path></svg>`,
        subItems: [
            {
                name: "Ajouter un producteur",
                icon: `<svg width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" ><path d="M22 11h-3V8h-2v3h-3v2h3v3h2v-3h3zM4 8c0 2.28 1.72 4 4 4s4-1.72 4-4-1.72-4-4-4-4 1.72-4 4m6 0c0 1.18-.82 2-2 2s-2-.82-2-2 .82-2 2-2 2 .82 2 2M3 20h10c.55 0 1-.45 1-1v-1c0-2.76-2.24-5-5-5H7c-2.76 0-5 2.24-5 5v1c0 .55.45 1 1 1m4-5h2c1.65 0 3 1.35 3 3H4c0-1.65 1.35-3 3-3"></path></svg>`,
                path: '/dashboard/add-producer'
            },
            {
                name: "Liste des producteurs",
                icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 3.25C4.25736 3.25 3.25 4.25736 3.25 5.5V18.5C3.25 19.7426 4.25736 20.75 5.5 20.75H18.5001C19.7427 20.75 20.7501 19.7426 20.7501 18.5V5.5C20.7501 4.25736 19.7427 3.25 18.5001 3.25H5.5ZM4.75 5.5C4.75 5.08579 5.08579 4.75 5.5 4.75H18.5001C18.9143 4.75 19.2501 5.08579 19.2501 5.5V18.5C19.2501 18.9142 18.9143 19.25 18.5001 19.25H5.5C5.08579 19.25 4.75 18.9142 4.75 18.5V5.5ZM6.25005 9.7143C6.25005 9.30008 6.58583 8.9643 7.00005 8.9643L17 8.96429C17.4143 8.96429 17.75 9.30008 17.75 9.71429C17.75 10.1285 17.4143 10.4643 17 10.4643L7.00005 10.4643C6.58583 10.4643 6.25005 10.1285 6.25005 9.7143ZM6.25005 14.2857C6.25005 13.8715 6.58583 13.5357 7.00005 13.5357H17C17.4143 13.5357 17.75 13.8715 17.75 14.2857C17.75 14.6999 17.4143 15.0357 17 15.0357H7.00005C6.58583 15.0357 6.25005 14.6999 6.25005 14.2857Z" fill="currentColor"></path></svg>`,
                path: '/dashboard/list-producers'
            },
        ],
    };

    othersItems: NavItem[] = [
        {
            name: "Contacter le support",
            icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 12C3.5 7.30558 7.30558 3.5 12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12ZM12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM11.0991 7.52507C11.0991 8.02213 11.5021 8.42507 11.9991 8.42507H12.0001C12.4972 8.42507 12.9001 8.02213 12.9001 7.52507C12.9001 7.02802 12.4972 6.62507 12.0001 6.62507H11.9991C11.5021 6.62507 11.0991 7.02802 11.0991 7.52507ZM12.0001 17.3714C11.5859 17.3714 11.2501 17.0356 11.2501 16.6214V10.9449C11.2501 10.5307 11.5859 10.1949 12.0001 10.1949C12.4143 10.1949 12.7501 10.5307 12.7501 10.9449V16.6214C12.7501 17.0356 12.4143 17.3714 12.0001 17.3714Z" fill=""></path></svg>`,
            path: '/dashboard/support'
        },
    ];

    openSubmenu: string | null | number = null;
    subMenuHeights: { [key: string]: number } = {};
    @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

    readonly isExpanded$;
    readonly isMobileOpen$;
    readonly isHovered$;
    errorMessage: string = "";

    constructor(
        public sidebarService: SidebarService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        this.isExpanded$ = this.sidebarService.isExpanded$;
        this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
        this.isHovered$ = this.sidebarService.isHovered$;
    }

    async ngOnInit() {
        // 1. D'abord charger le profil utilisateur
        await this.loadUserProfile();

        // 2. Ensuite mettre à jour les menus
        this.updateMenuItems();

        // 3. Ensuite seulement configurer les événements
        this.setupRouterEvents();
        this.setupSidebarObservables();

        // 4. Enfin vérifier la route active
        this.setActiveMenuFromRoute(this.router.url);
    }

    private async loadUserProfile() {
        try {
            // 1. Récupérer l'utilisateur auth de base
            const { user, error: userError } = await this.authService.getCurrentUser();

            if (userError || !user) {
                this.errorMessage = 'Aucun utilisateur connecté';
                return;
            }

            this.userProfile = user;
            console.log('Utilisateur auth:', this.userProfile);

            // 2. Récupérer le profil COMPLET depuis la base de données
            const { profile, error: profileError } = await this.authManagement.getUserProfile();

            // Vérifier le profil depuis les métadonnées ET depuis la base de données
            const metadataProfile = this.userProfile.user_metadata?.['profile'];
            const dbProfile = profile?.profile;
            
            // Priorité au profil de la base de données, sinon utiliser les métadonnées
            const finalProfile = dbProfile || metadataProfile;
            
            this.isCooperative = finalProfile === 'cooperative';
            
            // Admin uniquement avec cet email spécifique
            this.isAdmin = this.userProfile.email === 'k.ndiaye5@isepat.edu.sn';

            console.log('Profil utilisateur - Métadonnées:', metadataProfile, 'Base:', dbProfile, 'Final:', finalProfile);
            console.log('Email:', this.userProfile.email, 'isCooperative:', this.isCooperative, 'isAdmin:', this.isAdmin);
        } catch (error) {
            console.error('Erreur chargement profil:', error);
            this.isCooperative = false; // Par défaut, afficher le menu Producteurs
        }
    }

    private updateMenuItems() {
        // Toujours commencer avec les menus de base
        this.navItems = [...this.baseNavItems];

        // Ajouter le menu Producteurs seulement si c'est une coopérative
        if (this.isCooperative) {
            console.log('Ajout du menu Producteurs (coopérative)');
            this.navItems.push(this.producerMenu);
        } else {
            console.log('Menu Producteurs NON ajouté (pas coopérative)');
        }

        // Ajouter le menu Administration seulement si c'est un admin
        if (this.isAdmin) {
            console.log('Ajout du menu Administration (admin)');
            this.navItems.push(this.adminMenu);
        } else {
            console.log('Menu Administration NON ajouté (pas admin)');
        }

        console.log('Menus finaux:', this.navItems);

        // Forcer la mise à jour de la vue
        this.cdr.detectChanges();
    }

    private setupRouterEvents() {
        this.subscription.add(
            this.router.events.subscribe(event => {
                if (event instanceof NavigationEnd) {
                    console.log('NavigationEnd:', this.router.url);
                    this.setActiveMenuFromRoute(this.router.url);
                }
            })
        );
    }

    private setupSidebarObservables() {
        this.subscription.add(
            combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
                ([isExpanded, isMobileOpen, isHovered]) => {
                    if (!isExpanded && !isMobileOpen && !isHovered) {
                        this.cdr.detectChanges();
                    }
                }
            )
        );
    }

    private setActiveMenuFromRoute(currentUrl: string) {
        console.log('Recherche menu actif pour:', currentUrl);
        console.log('Menus disponibles:', this.navItems);

        this.navItems.forEach((nav, i) => {
            if (nav.subItems) {
                nav.subItems.forEach(subItem => {
                    if (currentUrl === subItem.path) {
                        const key = `main-${i}`;
                        console.log('Menu actif trouvé:', key, subItem.path);
                        this.openSubmenu = key;

                        setTimeout(() => {
                            const el = document.getElementById(key);
                            if (el) {
                                this.subMenuHeights[key] = el.scrollHeight;
                                this.cdr.detectChanges();
                            }
                        }, 100);
                    }
                });
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    isActive(path: string): boolean {
        return this.router.url === path;
    }

    toggleSubmenu(section: string, index: number) {
        const key = `${section}-${index}`;

        if (this.openSubmenu === key) {
            this.openSubmenu = null;
            this.subMenuHeights[key] = 0;
        } else {
            this.openSubmenu = key;

            setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                    this.subMenuHeights[key] = el.scrollHeight;
                    this.cdr.detectChanges();
                }
            });
        }
    }

    onSidebarMouseEnter() {
        this.isExpanded$.subscribe(expanded => {
            if (!expanded) {
                this.sidebarService.setHovered(true);
            }
        }).unsubscribe();
    }

    onSubmenuClick() {
        this.isMobileOpen$.subscribe(isMobile => {
            if (isMobile) {
                this.sidebarService.setMobileOpen(false);
            }
        }).unsubscribe();
    }
}