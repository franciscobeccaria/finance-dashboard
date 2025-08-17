import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Política de Privacidad
          </h1>
          
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <p className="text-sm text-gray-500 mb-4">
                Última actualización: {new Date().toLocaleDateString('es-ES')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Información que recopilamos
              </h2>
              <p className="mb-4">
                Presus recopila la siguiente información para brindar nuestros servicios de gestión financiera personal:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Información de cuenta de Google:</strong> Nombre, dirección de email e imagen de perfil 
                  para autenticación y personalización de la experiencia.
                </li>
                <li>
                  <strong>Datos de Gmail:</strong> Accedemos a emails específicos que contienen información 
                  de transacciones financieras de bancos y tarjetas de crédito para extraer automáticamente 
                  sus movimientos financieros.
                </li>
                <li>
                  <strong>Datos financieros:</strong> Transacciones, presupuestos y categorías que usted 
                  crea y gestiona en la aplicación.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Cómo utilizamos su información
              </h2>
              <p className="mb-4">
                Utilizamos la información recopilada para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proporcionar y mantener nuestros servicios de gestión financiera</li>
                <li>Procesar y categorizar automáticamente sus transacciones financieras</li>
                <li>Generar informes y análisis de sus hábitos de gasto</li>
                <li>Personalizar su experiencia en la aplicación</li>
                <li>Comunicarnos con usted sobre el servicio</li>
                <li>Mejorar y desarrollar nuevas funcionalidades</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. Protección de datos
              </h2>
              <p className="mb-4">
                Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger 
                su información personal contra acceso no autorizado, alteración, divulgación o destrucción:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cifrado de datos en tránsito y en reposo</li>
                <li>Autenticación segura mediante OAuth 2.0 de Google</li>
                <li>Acceso limitado a datos sensibles solo para funcionalidades específicas</li>
                <li>Servidores seguros y actualizados regularmente</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Uso de la API de Gmail
              </h2>
              <p className="mb-4">
                Presus utiliza la API de Gmail con el siguiente propósito específico:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Extracción de transacciones:</strong> Leemos únicamente emails de bancos y entidades 
                  financieras que contienen notificaciones de transacciones para extraer automáticamente 
                  la información de sus movimientos financieros.
                </li>
                <li>
                  <strong>Acceso limitado:</strong> Solo accedemos a emails específicos usando filtros 
                  de búsqueda precisos (remitentes bancarios conocidos y palabras clave específicas).
                </li>
                <li>
                  <strong>No almacenamiento de emails:</strong> No almacenamos el contenido completo de 
                  sus emails, solo extraemos y guardamos los datos de transacciones relevantes.
                </li>
              </ul>
              <p className="mt-4 text-sm bg-blue-50 p-3 rounded">
                <strong>Nota importante:</strong> Presus cumple con las políticas de datos limitados de Google. 
                Su información de Gmail se utiliza únicamente para los fines descritos y no se comparte 
                con terceros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Compartir información
              </h2>
              <p className="mb-4">
                No vendemos, comercializamos ni transferimos su información personal a terceros, excepto en 
                las siguientes circunstancias limitadas:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Con su consentimiento explícito</li>
                <li>Para cumplir con obligaciones legales</li>
                <li>Para proteger nuestros derechos, propiedad o seguridad</li>
                <li>Con proveedores de servicios que nos ayudan a operar la aplicación (bajo estrictos acuerdos de confidencialidad)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Sus derechos
              </h2>
              <p className="mb-4">
                Usted tiene los siguientes derechos respecto a su información personal:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acceso:</strong> Solicitar una copia de los datos que tenemos sobre usted</li>
                <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos</li>
                <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos personales</li>
                <li><strong>Portabilidad:</strong> Solicitar la transferencia de sus datos en formato estructurado</li>
                <li><strong>Revocación de consentimiento:</strong> Retirar el permiso de acceso a Gmail en cualquier momento</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, puede contactarnos en: 
                <a href="mailto:privacy@presus.app" className="text-blue-600 hover:text-blue-800">
                  privacy@presus.app
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                7. Retención de datos
              </h2>
              <p>
                Conservamos su información personal solo durante el tiempo necesario para cumplir con los 
                fines descritos en esta política, a menos que la ley requiera un período de retención más largo. 
                Cuando deje de usar nuestros servicios, eliminaremos o anonimizaremos su información personal 
                dentro de un plazo razonable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                8. Cambios a esta política
              </h2>
              <p>
                Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre 
                cambios significativos publicando la nueva política en esta página y actualizando la 
                fecha de &quot;última actualización&quot; en la parte superior.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                9. Contacto
              </h2>
              <p>
                Si tiene preguntas sobre esta Política de Privacidad o sobre nuestras prácticas de 
                manejo de datos, puede contactarnos en:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <p><strong>Email:</strong> privacy@presus.app</p>
                <p><strong>Aplicación:</strong> Presus - Gestión Financiera Personal</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver a la aplicación
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}