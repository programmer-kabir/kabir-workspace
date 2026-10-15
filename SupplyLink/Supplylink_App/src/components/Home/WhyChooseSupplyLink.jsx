import React from 'react'

 <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14 anim-fade-up delay-100">
              <span className="text-accent-500 text-sm font-semibold tracking-widest uppercase">
                Why Us
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Why Choose SupplyLink
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`glass-card rounded-2xl p-6 text-center anim-fade-up delay-${(i + 2) * 100} hover:border-accent-500/50 transition-all`}
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  {/* UPDATED: Text colors */}
                  <h3 className="font-semibold text-sm text-gray-900">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section> = () => {
  return (
    <div><section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14 anim-fade-up delay-100">
              <span className="text-accent-500 text-sm font-semibold tracking-widest uppercase">
                Why Us
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Why Choose SupplyLink
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`glass-card rounded-2xl p-6 text-center anim-fade-up delay-${(i + 2) * 100} hover:border-accent-500/50 transition-all`}
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  {/* UPDATED: Text colors */}
                  <h3 className="font-semibold text-sm text-gray-900">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section></div>
  )
}

export default <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14 anim-fade-up delay-100">
              <span className="text-accent-500 text-sm font-semibold tracking-widest uppercase">
                Why Us
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Why Choose SupplyLink
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <div
                  key={i}
                  className={`glass-card rounded-2xl p-6 text-center anim-fade-up delay-${(i + 2) * 100} hover:border-accent-500/50 transition-all`}
                >
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-500/10 flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  {/* UPDATED: Text colors */}
                  <h3 className="font-semibold text-sm text-gray-900">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>