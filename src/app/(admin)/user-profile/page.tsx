"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Image from "next/image";

interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  photo: string | null;
  role: 'USER' | 'ADMIN' | 'TI';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  photo?: File | null;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfilePage() {
  const { user: clerkUser } = useUser();
  const modal = useModal();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para cambio de contraseña
  const [passwordModal, setPasswordModal] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    photo: null,
  });

  const [passwordFormData, setPasswordFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Cargar perfil al montar el componente
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        const userData = data.user ?? data;
        setUserProfile(userData);
        
        // Pre-llenar formulario
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          phoneNumber: userData.phoneNumber || "",
          photo: null,
        });
      } else {
        console.error('Error fetching user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      photo: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Perfil actualizado exitosamente'
        });
        
        setFormData({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          phoneNumber: data.user.phoneNumber || "",
          photo: null,
        });
        
        // Recargar perfil
        fetchUserProfile();
        modal.closeModal();
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Error al actualizar el perfil'
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Error al actualizar el perfil'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordMessage(null);

    // Validaciones
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      setPasswordSubmitting(false);
      return;
    }

    // Validación de requisitos de contraseña
    const password = passwordFormData.newPassword;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasMinLength = password.length >= 8;

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
      let missingRequirements = [];
      if (!hasMinLength) missingRequirements.push('8 caracteres');
      if (!hasUpperCase) missingRequirements.push('minimo una mayúscula');
      if (!hasLowerCase) missingRequirements.push('minimo una minúscula');
      if (!hasNumbers) missingRequirements.push('minimo un número');
      if (!hasSymbols) missingRequirements.push('minimo un símbolo especial');
      
      setPasswordMessage({ 
        type: 'error', 
        text: `La contraseña debe tener: ${missingRequirements.join(', ')}`
      });
      setPasswordSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ 
          type: 'success', 
          text: 'Contraseña actualizada exitosamente'
        });
        
        // Resetear formulario
        setPasswordFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
          setPasswordModal(false);
          setPasswordMessage(null);
        }, 2000);
      } else {
        setPasswordMessage({ 
          type: 'error', 
          text: data.error || 'Error al cambiar la contraseña'
        });
      }
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'Error al cambiar la contraseña'
      });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'TI': return 'error';
      case 'ADMIN': return 'warning';
      case 'USER': return 'success';
      default: return 'light';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Mi Perfil" />
      
      {/* Mensaje de estado */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      <ComponentCard title="Información Personal">
        {userProfile && (
          <div className="space-y-6">
            {/* Información del perfil */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  {userProfile.photo ? (
                    <Image
                      width={80}
                      height={80}
                      src={userProfile.photo}
                      alt={`${userProfile.firstName} ${userProfile.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-2xl font-medium">
                      {userProfile.firstName?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                {/* Información básica */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {userProfile.firstName} {userProfile.lastName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {userProfile.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getRoleBadgeColor(userProfile.role) === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                      getRoleBadgeColor(userProfile.role) === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' :
                      getRoleBadgeColor(userProfile.role) === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                    }`}>
                      {userProfile.role}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      {userProfile.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={modal.openModal}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar Perfil
                </button>
                
                <button
                  onClick={() => setPasswordModal(true)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 shadow-sm hover:bg-brand-100 hover:text-brand-800 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30 dark:hover:text-brand-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  Cambiar Contraseña
                </button>
              </div>
            </div>

            {/* Detalles del perfil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nombre
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.firstName}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Apellido
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.lastName}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.email}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Teléfono
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.phoneNumber || 'No especificado'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Fecha de registro
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(userProfile.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Última actualización
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(userProfile.updatedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ComponentCard>

      {/* Modal de edición */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Editar Perfil
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Actualiza tu información personal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Teléfono
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Foto de Perfil
              </label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Selecciona una nueva foto para actualizar tu perfil
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={modal.closeModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Actualizando..." : "Actualizar Perfil"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de cambio de contraseña */}
      <Modal
        isOpen={passwordModal}
        onClose={() => {
          setPasswordModal(false);
          setPasswordMessage(null);
          setPasswordFormData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }}
        className="max-w-md p-4"
      >
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Cambiar Contraseña
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ingresa tu contraseña actual y la nueva contraseña
            </p>
          </div>

          {/* Indicaciones de seguridad para contraseña - Compacto */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Requisitos: 8+ caracteres, A-Z, a-z, 0-9, símbolos
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                  Ejemplo: MiContraseña123!
                </p>
              </div>
            </div>
          </div>

          {/* Mensaje de estado para contraseña */}
          {passwordMessage && (
            <div className={`p-4 rounded-lg ${
              passwordMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
            }`}>
              <p>{passwordMessage.text}</p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contraseña Actual *
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordFormData.currentPassword}
                onChange={handlePasswordInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva Contraseña *
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordFormData.newPassword}
                onChange={handlePasswordInputChange}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Ejemplo: MiContraseña123!"
              />
              
              {/* Indicador de requisitos en tiempo real - Compacto */}
              {passwordFormData.newPassword && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${passwordFormData.newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={passwordFormData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        8+ chars
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(passwordFormData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={/[A-Z]/.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        A-Z
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(passwordFormData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={/[a-z]/.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        a-z
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${/\d/.test(passwordFormData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={/\d/.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        0-9
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordFormData.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordFormData.newPassword) ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}>
                        !@#
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar Nueva Contraseña *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordFormData.confirmPassword}
                onChange={handlePasswordInputChange}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="Confirma tu nueva contraseña"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setPasswordModal(false);
                  setPasswordMessage(null);
                  setPasswordFormData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 border border-transparent rounded-md hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordSubmitting ? "Cambiando..." : "Cambiar Contraseña"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
