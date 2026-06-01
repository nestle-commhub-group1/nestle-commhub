import { Link } from 'react-router-dom';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../i18n/LanguageContext';

const sections = [
  {
    title: 'Data We Collect',
    items: [
      'Account details such as name, email, phone number, role, employee ID, staff category, and retailer business details.',
      'Operational records such as tickets, stock orders, promotion opt-ins, feedback, rewards, notifications, and timestamps.',
      'Browser session storage used to keep authenticated users signed in during their session.',
    ],
  },
  {
    title: 'Why We Use It',
    items: [
      'To route support issues to the correct Nestle staff category.',
      'To manage promotions, retailer opt-ins, stock fulfilment, distributor allocations, and reward credits.',
      'To provide dashboards, analytics, SLA monitoring, and audit evidence for operational decisions.',
    ],
  },
  {
    title: 'Access Controls',
    items: [
      'Role-based access control restricts dashboards and records to authorized users only.',
      'Retailers can access their own tickets, orders, promotions, and wallet data.',
      'HQ Admin, Staff, Promotion Manager, Stock Manager, and Distributor views are separated by operational responsibility.',
    ],
  },
  {
    title: 'Retention and Audit',
    items: [
      'Tickets, orders, promotions, and rewards retain status history and timestamps for traceability.',
      'Operational data should be retained only as long as required for support, fulfilment, reporting, and compliance.',
      'Passwords are stored as secure hashes and are never displayed in the application.',
    ],
  },
];

export default function PrivacyNotice() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#F0EDEA] px-4 py-10 text-[#2C1810]">
      <div className="fixed right-4 top-4 z-20 flex items-center gap-2">
        <ThemeToggle compact />
        <LanguageSelector compact />
      </div>
      <div className="mx-auto max-w-4xl">
        <Link to="/login" className="text-[13px] font-black uppercase tracking-widest text-[#3D2B1F] hover:underline">
          {t('Back to Login')}
        </Link>

        <section className="mt-6 rounded-[24px] border border-[#E0DBD5] bg-white p-8 shadow-sm">
          <p className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Nestle CommHub</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">{t('Privacy Notice')}</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-gray-600">
            This notice explains how CommHub uses business and personal data for support, promotions, ordering, distribution, analytics, and compliance workflows.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {sections.map(section => (
              <article key={section.title} className="rounded-[18px] border border-[#F0EDE8] bg-[#FAFAF9] p-5">
                <h2 className="text-lg font-black">{section.title}</h2>
                <ul className="mt-4 space-y-3 text-sm font-medium leading-6 text-gray-600">
                  {section.items.map(item => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3D2B1F]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[18px] border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-black uppercase tracking-widest text-amber-800">Compliance Alignment</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-amber-900">
              CommHub is designed to support Sri Lankan data protection expectations, role-based access control, auditability, and Nestle operational governance. Report privacy or access concerns to the system administrator.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
