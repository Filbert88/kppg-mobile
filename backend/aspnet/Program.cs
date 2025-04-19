using Microsoft.EntityFrameworkCore;
using aspnet.Data;
using Microsoft.AspNetCore.Http.Features;
using aspnet;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 524288000; // 500 MB
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient("LongRunningClient", client =>
{
    client.Timeout = TimeSpan.FromMinutes(50);
});
builder.Services.Configure<MyAppEnv>(
    builder.Configuration.GetSection("MyAppEnv"));
builder.WebHost.UseUrls("http://0.0.0.0:5180");
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection(); // only use in production
}

app.UseCors("AllowReactApp");

app.UseAuthorization();
app.UseStaticFiles();
app.MapControllers();

app.Run();
