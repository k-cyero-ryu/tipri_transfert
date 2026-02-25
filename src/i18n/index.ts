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
      clients: 'Clients',
      
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
      withdraw: 'Withdraw',
      amount: 'Amount',
      addUser: 'Add User',
      usersWithAccess: 'Users with Access',
      remove: 'Remove',
      close: 'Close',
      
      // Activity Log
      activityLog: 'Activity Log',
      dateTime: 'Date & Time',
      action: 'Action',
      details: 'Details',
      entity: 'Entity',
      user: 'User',
      
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
      paymentDetails: 'Payment Details',
      sendMoney: 'Send Money',
      senderInfo: 'Sender Information',
      notAssigned: 'Not Assigned',
      createdAt: 'Created At',
      
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
      costReport: 'Cost',
      withdrawalsReport: 'Withdrawals',
      accountTransactionsReport: 'Account Transactions',
      resumeReport: 'Resume',
      summary: 'Summary',
      transactionsReport: 'Transactions',
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
      
      // Clients
      creditLimit: 'Credit Limit',
      currentBalance: 'Current Balance',
      createClient: 'Create Client',
      editClient: 'Edit Client',
      liquidate: 'Liquidate',
      liquidateDebt: 'Liquidate Debt',
      liquidateConfirm: 'Are you sure you want to liquidate this client\'s debt?',
      debtLiquidated: 'Debt has been liquidated successfully',
      noDebtToLiquidate: 'No unpaid debt to liquidate',
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
      clients: 'Clients',
      
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
      withdraw: 'Retirer',
      amount: 'Montant',
      addUser: 'Ajouter utilisateur',
      usersWithAccess: 'Utilisateurs avec accès',
      remove: 'Retirer',
      close: 'Fermer',
      
      // Activity Log
      activityLog: 'Journal d\'activité',
      dateTime: 'Date et heure',
      action: 'Action',
      details: 'Détails',
      entity: 'Entité',
      user: 'Utilisateur',
      
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
      paymentDetails: 'Détails du paiement',
      sendMoney: 'Envoyer l\'argent',
      senderInfo: 'Informations de l\'expéditeur',
      notAssigned: 'Non assigné',
      createdAt: 'Créé le',
      
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
      costReport: 'Coût',
      withdrawalsReport: 'Retraits',
      accountTransactionsReport: 'Transactions de compte',
      resumeReport: 'Résumé',
      summary: 'Résumé',
      transactionsReport: 'Transactions',
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
      
      // Clients
      creditLimit: 'Limite de crédit',
      currentBalance: 'Solde actuel',
      createClient: 'Créer un client',
      editClient: 'Modifier le client',
      liquidate: 'Liquider',
      liquidateDebt: 'Liquider la dette',
      liquidateConfirm: 'Êtes-vous sûr de vouloir liquider la dette de ce client?',
      debtLiquidated: 'La dette a été liquidée avec succès',
      noDebtToLiquidate: 'Aucune dette impayée à liquider',
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
