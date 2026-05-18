export type TemplateId = 'horizontal' | 'card' | 'executive'

export type BuilderFormValues = {
  templateId: TemplateId
  personName: string
  personTitle: string
  companyName: string
  logoUrl: string
  logoAlt: string
  email: string
  phone1Display: string
  phone1Tel: string
  phone2Display: string
  phone2Tel: string
  websiteUrl: string
  websiteLabel: string
  addressLine1: string
  addressLine2: string
  showPhone2: boolean
  showAddress: boolean
  emailBody: string
}

const DEFAULT_LOGO_URL = 'https://i.imgur.com/L5O2aqs.png'

export const DEFAULT_FORM_VALUES: BuilderFormValues = {
  templateId: 'horizontal',
  personName: 'Ahmed Taher',
  personTitle: 'Technical Partner - Systems & Technology Department',
  companyName: 'Al Shafaq Al Qutbi Logistics Services (ALFS)',
  logoUrl: DEFAULT_LOGO_URL,
  logoAlt: 'Al Shafaq Al Qutbi Logistics Services (ALFS)',
  email: 'info@aurora-lfs.com',
  phone1Display: '+962 79 101 0199',
  phone1Tel: '+962791010199',
  phone2Display: '+962 79 649 5566',
  phone2Tel: '+962796495566',
  websiteUrl: 'https://www.aurora-lfs.net/',
  websiteLabel: 'www.aurora-lfs.net',
  addressLine1: 'Amman, Jordan - Al-Muwaffaqiyah, Agencies Street,',
  addressLine2: 'Al-Jawarni Commercial Complex No. 8, First Floor',
  showPhone2: true,
  showAddress: true,
  emailBody: `Dear [Name],

Thank you for your inquiry.

Please find the requested details below, and let me know if you would like me to prepare anything further.

Best regards,`,
}

export const resettableDefaults = () => ({ ...DEFAULT_FORM_VALUES })
