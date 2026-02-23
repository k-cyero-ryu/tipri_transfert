import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      appName: 'TIPRI Transfert',
      login: 'Login',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      actions: 'Actions',
      loading: 'Loading...',
      noData: 'No data available',
      success: 'Success',
      error: 'Error',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      all: 'All',
      
      // Auth
      username: 'Username',
      password: 'Password',
      loginTitle: 'Welcome to TIPRI Transfert',
      loginSubtitle: 'Sign in to continue',
      invalidCredentials: 'Invalid username or password',
      
      // Navigation
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      accounts: 'Accounts',
      users: 'Users',
      reports: 'Reports',
      settings: 'Settings',
      
      // Dashboard
      totalBalance: 'Total Balance',
      todayTransactions: "Today's Transactions",
      completedTransactions: 'Completed',
      pendingTransactions: 'Pending',
      totalTransactions: 'Total Transactions',
      pendingPayments: 'Pending Payments',
      pendingCredit: 'Pending Credit',
      activeUsers: 'Active Users',
      
      // Accounts
      accountName: 'Account Name',
      accountType: 'Type',
      accountDetail: 'Detail',
      accountCurrency: 'Currency',
      accountBalance: 'Balance',
      accountStatus: 'Status',
      createAccount: 'Create Account',
      editAccount: 'Edit Account',
      accountAccess: 'Account Access',
      grantAccess: 'Grant Access',
      
      // Transactions
      clientName: 'Client Name',
      paymentMethod: 'Payment Method',
      paymentAmount: 'Payment Amount',
      paymentStatus: 'Payment Status',
      transactionAmount: 'Transaction Amount',
      transactionMethod: 'Transaction Method',
      transactionDetails: 'Transaction Details',
      transactionStatus: 'Transaction Status',
      taxRate: 'Exchange Rate',
      senderAccount: 'Sender Account',
      receiverAccount: 'Receiver Account',
      createTransaction: 'Create Transaction',
      confirmPayment: 'Confirm Payment',
      confirmTransaction: 'Confirm Transaction',
      cancelTransaction: 'Cancel Transaction',
      isCredit: 'Credit Transaction',
      creditDueDate: 'Due Date',
      creditPaid: 'Credit Paid',
      
      // Users
      fullName: 'Full Name',
      userRole: 'Role',
      admin: 'Admin',
      cashier: 'Cashier',
      createUser: 'Create User',
      editUser: 'Edit User',
      
      // Reports
      receivedReport: 'Money Received',
      transferredReport: 'Money Transferred',
      creditReport: 'Unpaid Credit',
      profitReport: 'Profit',
      dateRange: 'Date Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      totalReceived: 'Total Received',
      totalTransferred: 'Total Transferred',
      totalUnpaidCredit: 'Total Unpaid Credit',
      totalProfit: 'Total Profit',
      generateReport: 'Generate Report',
      exportPDF: 'Export PDF',
      
      // Settings
      creditNotificationDays: 'Credit Notification Days',
      businessName: 'Business Name',
      defaultTaxRate: 'Default Tax Rate',
      
      // Status
      pending: 'Pending',
      paid: 'Paid',
      canceled: 'Canceled',
      active: 'Active',
      inactive: 'Inactive',
      
      // Payment Methods
      cash: 'Cash',
      zelle: 'Zelle',
      paypal: 'PayPal',
      bankTransfer: 'Bank Transfer',
      mooncash: 'MoonCash',
      natcash: 'NatCash',
      credit: 'Credit',
      transfer: 'Transfer',
    }
  },
  fr: {
    translation: {
      // Common
      appName: 'TIPRI Transfert',
      login: 'Connexion',
      logout: 'Déconnexion',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      search: 'Rechercher',
      filter: 'Filtrer',
      export: 'Exporter',
      actions: 'Actions',
      loading: 'Chargement...',
      noData: 'Aucune donnée disponible',
      success: 'Succès',
      error: 'Erreur',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      all: 'Tout',
      
      // Auth
      username: "Nom d'utilisateur",
      password: 'Mot de passe',
      loginTitle: 'Bienvenue sur TIPRI Transfert',
      loginSubtitle: 'Connectez-vous pour continuer',
      invalidCredentials: "Nom d'utilisateur ou mot de passe invalide",
      
      // Navigation
      dashboard: 'Tableau de bord',
      transactions: 'Transactions',
      accounts: 'Comptes',
      users: 'Utilisateurs',
      reports: 'Rapports',
      settings: 'Paramètres',
      
      // Dashboard
      totalBalance: 'Solde Total',
      todayTransactions: "Transactions d'aujourd'hui",
      completedTransactions: 'Terminées',
      pendingTransactions: 'En attente',
      totalTransactions: 'Transactions Totales',
      pendingPayments: 'Paiements en attente',
      pendingCredit: 'Crédit en attente',
      activeUsers: 'Utilisateurs actifs',
      
      // Accounts
      accountName: 'Nom du compte',
      accountType: 'Type',
      accountDetail: 'Détail',
      accountCurrency: 'Devise',
      accountBalance: 'Solde',
      accountStatus: 'Statut',
      createAccount: 'Créer un compte',
      editAccount: 'Modifier le compte',
      accountAccess: 'Accès au compte',
      grantAccess: "Accorder l'accès",
      
      // Transactions
      clientName: 'Nom du client',
      paymentMethod: 'Mode de paiement',
      paymentAmount: 'Montant du paiement',
      paymentStatus: 'Statut du paiement',
      transactionAmount: 'Montant de la transaction',
      transactionMethod: 'Mode de transaction',
      transactionDetails: 'Détails de la transaction',
      transactionStatus: 'Statut de la transaction',
      taxRate: 'Taux de change',
      senderAccount: 'Compte émetteur',
      receiverAccount: 'Compte récepteur',
      createTransaction: 'Créer une transaction',
      confirmPayment: 'Confirmer le paiement',
      confirmTransaction: 'Confirmer la transaction',
      executeTransaction: 'Exécuter la transaction',
      cancelTransaction: 'Annuler la transaction',
      isCredit: 'Transaction à crédit',
      creditDueDate: "Date d'échéance",
      creditPaid: 'Crédit payé',
      
      // Users
      fullName: 'Nom complet',
      userRole: 'Rôle',
      admin: 'Administrateur',
      cashier: 'Caissier',
      createUser: 'Créer un utilisateur',
      editUser: "Modifier l'utilisateur",
      
      // Reports
      receivedReport: 'Argent reçu',
      transferredReport: 'Argent transféré',
      creditReport: 'Crédit impayé',
      profitReport: 'Profit',
      dateRange: 'Période',
      startDate: 'Date de début',
      endDate: 'Date de fin',
      totalReceived: 'Total reçu',
      totalTransferred: 'Total transféré',
      totalUnpaidCredit: 'Total crédit impayé',
      totalProfit: 'Profit total',
      generateReport: 'Générer le rapport',
      exportPDF: 'Exporter en PDF',
      
      // Settings
      creditNotificationDays: 'Jours de notification de crédit',
      businessName: 'Nom de l\'entreprise',
      defaultTaxRate: 'Taux de taxe par défaut',
      
      // Status
      pending: 'En attente',
      paid: 'Payé',
      canceled: 'Annulé',
      active: 'Actif',
      inactive: 'Inactif',
      
      // Payment Methods
      cash: 'Espèces',
      zelle: 'Zelle',
      paypal: 'PayPal',
      bankTransfer: 'Virement bancaire',
      mooncash: 'MoonCash',
      natcash: 'NatCash',
      credit: 'Crédit',
      transfer: 'Transfert',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
