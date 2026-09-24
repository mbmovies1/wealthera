import React from 'react';
import { useApp } from '../context/AppContext.js';
import { Logo } from '../components/Logo.js';
import {
  Headphones,
  MessageCircle,
  Send,
  Mail,
  Users,
  ArrowUpRight,
  ShieldCheck,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { CustomerSupportLink } from '../types.js';

export const CustomerSupportView: React.FC = () => {
  const { supportLinks, settings } = useApp();

  const getChannelIcon = (type: CustomerSupportLink['type']) => {
    switch (type) {
      case 'telegram':
        return <Send className="w-5 h-5 text-aqua-700" />;
      case 'telegram_group':
        return <Users className="w-5 h-5 text-aqua-800" />;
      case 'whatsapp':
        return <MessageCircle className="w-5 h-5 text-emerald-600" />;
      case 'email':
        return <Mail className="w-5 h-5 text-peach-500" />;
      case 'phone':
        return <Phone className="w-5 h-5 text-emerald-600" />;
      default:
        return <Headphones className="w-5 h-5 text-aqua-700" />;
    }
  };

  // Only display active / enabled links, sorted by display order
  const activeLinks = (supportLinks || [])
    .filter((link) => link.enabled !== false && (link.link || link.value))
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  // Determine if WhatsApp or Phone helpline are actively configured in the enabled channels
  const activeWhatsapp = activeLinks.find((l) => l.type === 'whatsapp');
  const activePhone = activeLinks.find((l) => l.type === 'phone');

  // Remaining channels to show in the list below
  const listChannels = activeLinks.filter((l) => l.id !== activeWhatsapp?.id && l.id !== activePhone?.id);

  /**
   * Intelligently resolves and normalizes links so clicking opens the right app/protocol:
   * - Email: mailto:user@domain.com
   * - Phone: tel:+123456789
   * - WhatsApp: https://wa.me/123456789
   * - Telegram: https://t.me/channel
   * - Web: https://...
   */
  const resolveActionLink = (channel: CustomerSupportLink): string => {
    let raw = (channel.link || channel.value || '').trim();
    if (!raw) return '#';

    if (channel.type === 'email') {
      if (raw.startsWith('mailto:')) return raw;
      // Extract pure email address if wrapped in text or link
      const emailMatch = raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return emailMatch ? `mailto:${emailMatch[1]}` : `mailto:${raw}`;
    }

    if (channel.type === 'phone') {
      if (raw.startsWith('tel:')) return raw;
      const digitsOnly = raw.replace(/[^0-9+]/g, '');
      return `tel:${digitsOnly || raw}`;
    }

    if (channel.type === 'whatsapp') {
      if (raw.startsWith('https://wa.me/') || raw.startsWith('https://api.whatsapp.com/')) {
        return raw;
      }
      const digitsOnly = raw.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 7) {
        return `https://wa.me/${digitsOnly}`;
      }
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
      }
      return `https://wa.me/${raw}`;
    }

    if (channel.type === 'telegram' || channel.type === 'telegram_group') {
      if (raw.startsWith('https://t.me/') || raw.startsWith('https://telegram.me/')) {
        return raw;
      }
      if (raw.startsWith('@')) {
        return `https://t.me/${raw.substring(1)}`;
      }
      if (raw.startsWith('t.me/')) {
        return `https://${raw}`;
      }
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        return raw;
      }
      return `https://t.me/${raw}`;
    }

    // Default: Ensure protocol exists for web links
    if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('mailto:') && !raw.startsWith('tel:')) {
      return `https://${raw}`;
    }

    return raw;
  };

  const isExternalTarget = (resolvedHref: string) => {
    return resolvedHref.startsWith('http://') || resolvedHref.startsWith('https://');
  };

  const cleanWhatsappDigits = (settings.whatsappNumber || '').replace(/[^0-9]/g, '');
  const cleanPhoneDigits = (settings.supportPhone || '').replace(/[^0-9+]/g, '');

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-300">
      {/* Hero Card */}
      <div className="bg-aqua-950 border border-aqua-900 rounded-3xl p-6 text-white shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-peach-500 flex items-center justify-center shadow-xs">
            <Headphones className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <Logo variant="icon" size="sm" />
        </div>
        <h3 className="text-xl font-black tracking-tight text-white">Customer Care Concierge</h3>
        <p className="text-xs text-aqua-100 leading-relaxed">
          Need assistance with deposits, withdrawals, or portfolio management? Our dedicated customer care team is available around the clock.
        </p>
      </div>

      {/* Quick Direct Actions (WhatsApp & Phone Helpline) - Only shown if active */}
      {(activeWhatsapp || activePhone) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeWhatsapp && (
            <a
              id="quick-whatsapp-btn"
              href={resolveActionLink(activeWhatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-sm transition-all active:scale-[0.99] group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">
                  {activeWhatsapp.title || 'WhatsApp Support'}
                </div>
                <div className="text-sm font-black truncate">{activeWhatsapp.value || settings.whatsappNumber}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          )}

          {activePhone && (
            <a
              id="quick-phone-btn"
              href={resolveActionLink(activePhone)}
              className="flex items-center gap-3 bg-aqua-900 hover:bg-aqua-950 text-white p-4 rounded-2xl shadow-sm transition-all active:scale-[0.99] group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-aqua-200 uppercase tracking-wider">
                  {activePhone.title || 'Helpline Number'}
                </div>
                <div className="text-sm font-black truncate">{activePhone.value || settings.supportPhone}</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-aqua-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          )}
        </div>
      )}

      {/* Support Channels List (Telegram Groups, Official Desks, Email, etc.) */}
      <div className="space-y-2.5">
        {activeLinks.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-xs space-y-2">
            <Headphones className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">No support channels currently active.</p>
            <p className="text-[11px] text-slate-400">Please contact our administrative team or check back soon.</p>
          </div>
        ) : (
          (listChannels.length > 0 ? listChannels : activeLinks).map((channel) => {
            const resolvedHref = resolveActionLink(channel);
            const isExternal = isExternalTarget(resolvedHref);
            return (
              <a
                key={channel.id}
                id={`support-${channel.id}-link`}
                href={resolvedHref}
                target={isExternal ? '_blank' : '_self'}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="block bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-xs transition-all active:scale-[0.99] group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getChannelIcon(channel.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-black text-slate-900 truncate">{channel.title}</h4>
                        {channel.badge && (
                          <span className="text-[10px] font-bold text-aqua-800 bg-aqua-50 border border-aqua-200/60 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {channel.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate">
                        {channel.description || channel.value}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:text-slate-800 flex items-center justify-center transition-colors shrink-0">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      <div className="p-4 bg-aqua-50 rounded-2xl border border-aqua-100/80 flex items-center gap-2 text-xs text-aqua-950">
        <ShieldCheck className="w-4 h-4 text-aqua-700 shrink-0" />
        <span>WEALTHERA representatives will never ask for your account password or secret credentials.</span>
      </div>
    </div>
  );
};
