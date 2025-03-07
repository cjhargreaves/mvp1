'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [formData, setFormData] = useState({
    productUrl: '',
    budget: '',
    material: '',
    comments: '',
    name: '',
    phone: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    // Validate required fields
    if (uploadType === 'file' && !selectedImage) {
      setSubmitError('Please upload a product image');
      setIsSubmitting(false);
      return;
    }

    if (uploadType === 'url' && !formData.productUrl?.trim()) {
      setSubmitError('Please enter a product URL');
      setIsSubmitting(false);
      return;
    }

    if (!formData.budget?.trim()) {
      setSubmitError('Please enter your budget');
      setIsSubmitting(false);
      return;
    }

    if (!formData.name?.trim()) {
      setSubmitError('Please enter your name');
      setIsSubmitting(false);
      return;
    }

    if (!formData.phone?.trim()) {
      setSubmitError('Please enter your phone number');
      setIsSubmitting(false);
      return;
    }

    // Validate budget is a number
    const budgetNum = parseFloat(formData.budget);
    if (isNaN(budgetNum)) {
      setSubmitError('Please enter a valid budget amount');
      setIsSubmitting(false);
      return;
    }

    try {
      let imageUrl = null;

      if (uploadType === 'file' && selectedImage) {
        // Upload image to mvp_bucket
        const { data: storageData, error: storageError } = await supabase.storage
          .from('mvp_bucket')
          .upload(`${Date.now()}-${selectedImage.name}`, selectedImage);

        if (storageError) {
          console.error('Image upload error:', storageError);
          throw new Error('Failed to upload image');
        }

        // Get the public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('mvp_bucket')
          .getPublicUrl(storageData.path);

        imageUrl = publicUrlData.publicUrl;
      } else if (uploadType === 'url') {
        imageUrl = formData.productUrl.trim();
      }


      // Then insert the form data with the image URL
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([
          {
            product_url: imageUrl,
            budget: budgetNum,
            material: formData.material.trim() || null,
            extra_comments: formData.comments.trim() || null,
            name: formData.name.trim() || null,
            phone_number: formData.phone.trim() || null,
          }
        ])
        .select();

      if (error) {
        console.error('Supabase insertion error:', error);
        if (error.code === '23505') {
          throw new Error('This submission already exists');
        } else if (error.code === '42P01') {
          throw new Error('Table not found. Please check your database setup');
        } else if (error.code === '42703') {
          throw new Error('Invalid column name. Please check the form fields');
        } else if (error.code === '23502') {
          throw new Error('Required field missing');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      console.log('Successfully inserted data:', data);

      // Clear form and image on success
      setFormData({
        productUrl: '',
        budget: '',
        material: '',
        comments: '',
        name: '',
        phone: ''
      });
      setSelectedImage(null);

      alert('Thank you! We will text you with our hand-selected dupes soon!');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('There was an error submitting your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="min-h-screen font-normal">
      {/* Home Link - Fixed position */}
      <Link href="/" className="fixed left-4 md:left-8 top-4 md:top-8 text-lg md:text-xl text-white hover:opacity-80 transition-opacity z-50 font-normal">
        r/DUPE.it
      </Link>

      <div className="bg-[#F77192] p-4 md:p-8 pt-24 md:pt-32 pb-12 md:pb-20">
        <div className="max-w-4xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-12 md:mb-20">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 md:mb-6">FIND DUPES</h1>
            <button
              type="submit"
              form="dupeForm"
              disabled={isSubmitting}
              className="text-xl md:text-3xl font-normal bg-white rounded-2xl px-6 md:px-8 py-2 md:py-3 hover:bg-opacity-90 transition-all disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit a Request'}
            </button>
          </div>

          {/* Form Section */}
          <form id="dupeForm" onSubmit={handleSubmit} className="space-y-8">
            {submitError && (
              <div className="bg-[#FFD5DF] border border-[#F77192] text-[#F77192] px-4 py-3 rounded-2xl relative text-center" role="alert">
                <span className="block sm:inline">{submitError}</span>
              </div>
            )}
            <div className="flex items-start gap-16 relative">
              {/* Step 1 */}
              <div className="flex-1 w-full lg:w-auto z-10">
                <div className="bg-[#FFD5DF] rounded-2xl p-4 mb-6 flex items-center">
                  <span className="text-3xl text-[#F77192] font-bold mr-3 font-[var(--font-mundo-serif)]">1</span>
                  <h3 className="font-bold text-lg">Upload Product(s)</h3>
                </div>
                <div className="relative space-y-4">
                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      onClick={() => setUploadType('file')}
                      className={`px-4 py-2 rounded-lg ${
                        uploadType === 'file'
                          ? 'bg-[#F77192] text-white'
                          : 'bg-white text-[#F77192]'
                      }`}
                    >
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType('url')}
                      className={`px-4 py-2 rounded-lg ${
                        uploadType === 'url'
                          ? 'bg-[#F77192] text-white'
                          : 'bg-white text-[#F77192]'
                      }`}
                    >
                      Enter URL
                    </button>
                  </div>
                  
                  {uploadType === 'url' ? (
                    <div className="relative">
                      <input
                        type="url"
                        name="productUrl"
                        placeholder="Enter product image URL"
                        value={formData.productUrl}
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-white rounded-2xl focus:outline-none text-gray-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F77192]">*</span>
                    </div>
                  ) : (
                    <div className="flex flex-col bg-white rounded-2xl h-[212px]">
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                      {selectedImage ? (
                        <div className="relative w-full h-full p-4 flex flex-col items-center justify-center">
                          <Image
                            src={URL.createObjectURL(selectedImage)}
                            alt="Preview"
                            width={140}
                            height={140}
                            className="max-h-[140px] object-contain mb-2"
                          />
                          <p className="text-sm text-gray-500 truncate w-full text-center">
                            {selectedImage.name}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4">
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <p className="text-gray-500">Click to upload product image</p>
                          <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <span className="absolute right-4 top-4 text-[#F77192]">*</span>
                    </label>
                  </div>
                  )}
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex-1 w-full lg:w-auto z-10">
                <div className="bg-[#FFD5DF] rounded-2xl p-4 mb-6 flex items-center">
                  <span className="text-3xl text-[#F77192] font-bold mr-3 font-[var(--font-mundo-serif)]">2</span>
                  <h3 className="font-bold text-lg">Preferences???</h3>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      name="budget"
                      placeholder="Budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-white rounded-2xl focus:outline-none text-gray-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F77192]">*</span>
                  </div>
                  <input
                    type="text"
                    name="material"
                    placeholder="Material"
                    value={formData.material}
                    onChange={handleChange}
                    className="w-full h-12 px-4 bg-white rounded-2xl focus:outline-none text-gray-500"
                  />
                  <textarea
                    name="comments"
                    placeholder="Any other comments"
                    value={formData.comments}
                    onChange={handleChange}
                    className="w-full h-[84px] px-4 py-3 bg-white rounded-2xl focus:outline-none text-gray-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex-1 w-full lg:w-auto z-10">
                <div className="bg-[#FFD5DF] rounded-2xl p-4 mb-6 flex items-center">
                  <span className="text-3xl text-[#F77192] font-bold mr-3 font-[var(--font-mundo-serif)]">3</span>
                  <h3 className="font-bold text-lg">We&apos;ll find it!</h3>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-white rounded-2xl focus:outline-none text-gray-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F77192]">*</span>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full h-12 px-4 bg-white rounded-2xl focus:outline-none text-gray-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F77192]">*</span>
                  </div>
                  <div className="bg-[#FFD5DF] p-4 rounded-2xl text-center">
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <span>We&apos;ll text you with our hand-selected dupes!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Demo Section with new background color */}
      <div className="bg-[#FFD5DF] p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Demo Section */}
          <div className="mt-8">
            <h2 className="text-4xl text-center mb-8">Demo</h2>
            <div className="bg-white rounded-lg p-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Original Product */}
                <div className="text-center">
                  <div className="text-2xl mb-4 flex justify-center">
                    <Image
                      src="/images/skims_logo.png"
                      alt="SKIMS Logo"
                      width={120}
                      height={40}
                      className="h-10 w-auto"
                    />
                  </div>
                  <div className="aspect-[3/4] relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="/images/skims.png"
                      alt="SKIMS Long Slip Dress"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-bold mb-2">Long Slip Dress</h3>
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">91% Modal</span>
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">9% Elastane</span>
                  </div>
                  <div className="text-2xl font-bold">$80</div>
                </div>

                {/* Dupe Product */}
                <div className="text-center">
                  <div className="text-2xl mb-4 flex justify-center">
                    <Image
                      src="/images/dupe_logo.png"
                      alt="PUMIEY Logo"
                      width={120}
                      height={40}
                      className="h-10 w-auto"
                    />
                  </div>
                  <div className="aspect-[3/4] relative mb-4 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src="/images/dupe.png"
                      alt="PUMIEY Slip Maxi Dress"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-bold mb-2">Slip Maxi Dress</h3>
                  <div className="flex flex-wrap justify-center gap-2 mb-2">
                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">95% Modal</span>
                    <span className="bg-amber-700 text-white px-2 py-1 rounded text-sm">5% Spandex</span>
                  </div>
                  <div className="text-2xl font-bold">$25</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
