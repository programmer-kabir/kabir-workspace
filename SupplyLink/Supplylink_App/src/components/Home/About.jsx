
export default function About() {
  return (
    <section id="about" className="py-20 bg-[#f3f3f3]">
      <div className="max-width mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-14">
          আমাদের গ্যালারি
        </h2>

        {/* Masonry Layout */}

        <div className="hidden lg:inline">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="grid gap-4">
            <div>
              <image
                width={500}
                height={470}
                className="w-full h-[410px] rounded-xl object-fill"
                src="https://supplylinkbd.com/img/customer_with_product/(1).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[320px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(2).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[320px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(3).jpg"
                alt=""
              />
            </div>
          </div>
          <div className="grid gap-4">
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[310px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(4).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[470px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(5).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[270px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(6).jpg"
                alt=""
              />
            </div>
          </div>
          <div className="grid gap-4">
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[430px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(7).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[310px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(8).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[310px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(9).jpg"
                alt=""
              />
            </div>
          </div>
          <div className="grid gap-4">
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[310px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(10).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[470px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(11).jpg"
                alt=""
              />
            </div>
            <div>
              <image
                width={500}
                height={500}
                className="w-full h-[270px] rounded-xl object-cover"
                src="https://supplylinkbd.com/img/customer_with_product/(12).jpg"
                alt=""
              />
            </div>
          </div>
        </div>
        </div>
        <div className="lg:hidden">
          <div className="columns-2 md:columns-4 gap-4 space-y-4">

          {[1,2,3,4,5,6,7,8,9,10,11,12].map((i) => (
            <div key={i} className="break-inside-avoid">
              <image
                width={500}
                height={500}
                src={`https://supplylinkbd.com/img/customer_with_product/(${i}).jpg`}
                alt=""
                className="w-full rounded-xl object-cover"
              />
            </div>
          ))}

        </div>
        </div>
      </div>
    </section>
  );
}
