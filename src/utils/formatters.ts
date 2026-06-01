/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Formats minutes (e.g. 120 -> "+2h 00m", -45 -> "-0h 45m")
export const formatHoursBank = (totalMinutes: number): string => {
  const isNegative = totalMinutes < 0;
  const absMinutes = Math.abs(totalMinutes);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  
  const sign = isNegative ? '-' : '+';
  const paddedMinutes = minutes.toString().padStart(2, '0');
  
  return `${sign}${hours}h${paddedMinutes}m`;
};

// Formats standard worked minutes to simple time representation (e.g. 487 -> "8h 07m")
export const formatWorkedTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const paddedMinutes = minutes.toString().padStart(2, '0');
  return `${hours}h ${paddedMinutes}m`;
};

// Formats CPF (e.g., "11111111111" to "111.111.111-11")
export const formatCPF = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

// Formats ISO DateTime to Brazilian pattern "DD/MM/YYYY às HH:MM"
export const formatDateTime = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Data inválida';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return 'Data inválida';
  }
};

// Formats ISO string into just time "HH:MM"
export const formatTimeOnly = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '--:--';
  }
};

export const formatDateOnly = (dateString: string): string => {
  try {
    // If YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};
